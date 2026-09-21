import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { MongoMemoryServer } from 'mongodb-memory-server';
const cookieParser = require('cookie-parser');
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

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
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  const testUser = {
    name: 'E2E User',
    email: 'e2e@skillnest.dev',
    password: 'Password123!',
  };

  let accessToken = '';
  let refreshTokenCookie = '';

  it('POST /api/v1/auth/register -> should register and return tokens with cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.data.accessToken;
    refreshTokenCookie = res.headers['set-cookie'][0];
  });

  it('GET /api/v1/auth/me -> should return profile with Bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.email).toBe(testUser.email);
  });

  it('POST /api/v1/auth/refresh -> should rotate refresh token and issue new access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshTokenCookie])
      .expect(200);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.data.accessToken;
    refreshTokenCookie = res.headers['set-cookie'][0];
  });

  it('POST /api/v1/auth/logout -> should revoke token and clear cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', [refreshTokenCookie])
      .expect(200);

    expect(res.body.data.message).toBe('Logged out successfully');
  });

  it('POST /api/v1/auth/login -> should authenticate and return tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe(testUser.email);
  });
});
