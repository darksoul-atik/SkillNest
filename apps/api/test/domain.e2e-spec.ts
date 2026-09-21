import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { MongoMemoryServer } from 'mongodb-memory-server';
const cookieParser = require('cookie-parser');
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtService } from '@nestjs/jwt';
import { GroupCategory, UserRole } from '@skillnest/shared';
import { AppModule } from '../src/app.module';
import { UsersRepository } from '../src/modules/users/users.repository';

describe('Domain E2E: Groups, Race-Safe Memberships, Comments & Replies', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let usersRepository: UsersRepository;
  let jwtService: JwtService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_32chars_long';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_32chars_long';
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(new ZodValidationPipe());

    await app.init();

    usersRepository = app.get(UsersRepository);
    jwtService = app.get(JwtService);
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  async function createTestUser(name: string, email: string) {
    const user = await usersRepository.create({
      name,
      email: email.toLowerCase(),
      isActive: true,
      emailVerified: true,
      role: UserRole.USER,
    });
    const token = await jwtService.signAsync({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    return { token, user };
  }

  let hostToken: string;
  let memberToken: string;
  let otherToken: string;
  let groupId: string;
  let commentId: string;

  it('Setup: Register host and test users', async () => {
    const host = await createTestUser('Host User', 'host@skillnest.dev');
    hostToken = host.token;

    const member = await createTestUser('Member User', 'member@skillnest.dev');
    memberToken = member.token;

    const other = await createTestUser('Other User', 'other@skillnest.dev');
    otherToken = other.token;
  });

  it('POST /api/v1/groups -> should create group with host as 1st member', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app.getHttpServer())
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        name: 'Robotics Workshop',
        description: 'Learn modern robotics with ROS and Raspberry Pi',
        category: GroupCategory.TECH_CODING,
        location: 'Downtown Innovation Lab',
        maxMembers: 10,
        startDate: futureDate,
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.memberCount).toBe(1);
    expect(res.body.data.isHost).toBe(true);
    groupId = res.body.data.id;
  });

  it('Parallel Join Race Safety: 20 concurrent joins against maxMembers: 10', async () => {
    // We already have host (member 1). Exactly 9 of the concurrent joins must succeed.
    const concurrentUsers = await Promise.all(
      Array.from({ length: 20 }).map((_, i) =>
        createTestUser(`Contender ${i}`, `contender${i}@skillnest.dev`),
      ),
    );

    const joinPromises = concurrentUsers.map((u) =>
      request(app.getHttpServer())
        .post(`/api/v1/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${u.token}`),
    );

    const responses = await Promise.all(joinPromises);
    const successCount = responses.filter((r) => r.status === 201).length;
    const conflictCount = responses.filter((r) => r.status === 409).length;

    // Exactly 9 should succeed because host is 1 + 9 = 10 maxMembers
    expect(successCount).toBe(9);
    expect(conflictCount).toBe(11);

    // Verify group state
    const grpRes = await request(app.getHttpServer())
      .get(`/api/v1/groups/${groupId}`)
      .expect(200);

    expect(grpRes.body.data.memberCount).toBe(10);
  });

  it('Authorization: Non-host cannot edit or delete group', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacked Group Name' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('Host cannot leave own group', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/groups/${groupId}/members/me`)
      .set('Authorization', `Bearer ${hostToken}`)
      .expect(400);
  });

  it('Comments & Host-only Replies: creation, permission, soft-delete', async () => {
    // 1. Post top-level comment as member
    const commentRes = await request(app.getHttpServer())
      .post(`/api/v1/groups/${groupId}/comments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ body: 'Will kits and soldering irons be provided?' })
      .expect(201);

    expect(commentRes.body.data).toHaveProperty('id');
    commentId = commentRes.body.data.id;
    expect(commentRes.body.data.replyCount).toBe(0);

    // 2. Non-host attempts to reply -> 403 Forbidden
    await request(app.getHttpServer())
      .post(`/api/v1/comments/${commentId}/replies`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ body: 'I am not the host but here is my opinion' })
      .expect(403);

    // 3. Host replies to comment -> 201 Created
    const replyRes = await request(app.getHttpServer())
      .post(`/api/v1/comments/${commentId}/replies`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ body: 'Yes, full hardware kits will be provided at the lab!' })
      .expect(201);

    expect(replyRes.body.data.body).toContain('full hardware kits');

    // 4. Fetch comments: verify replyCount is 1 and reply is previewed
    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/groups/${groupId}/comments`)
      .expect(200);

    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].replyCount).toBe(1);
    expect(listRes.body.data[0].repliesPreview).toHaveLength(1);

    // 5. Author soft-deletes comment
    await request(app.getHttpServer())
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(204);

    // Verify comment is removed from list
    const afterDeleteRes = await request(app.getHttpServer())
      .get(`/api/v1/groups/${groupId}/comments`)
      .expect(200);
    expect(afterDeleteRes.body.data).toHaveLength(0);
  });
});
