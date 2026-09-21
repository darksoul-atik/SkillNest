import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersRepository } from '../modules/users/users.repository';
import { GroupsRepository } from '../modules/groups/groups.repository';
import { CommentsRepository } from '../modules/comments/comments.repository';
import { MediaService } from '../modules/media/media.service';
import * as argon2 from 'argon2';
const sharp = require('sharp');
import {
  UserRole,
  AuthProvider,
  GroupCategory,
  GroupStatus,
  MembershipRole,
  MediaPurpose,
} from '@skillnest/shared';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';

async function bootstrap() {
  const logger = new Logger('SeedData');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const usersRepo = app.get(UsersRepository);
    const groupsRepo = app.get(GroupsRepository);
    const commentsRepo = app.get(CommentsRepository);
    const mediaService = app.get(MediaService);

    logger.log('Starting demo data seed...');
    const pwdHash = await argon2.hash('Password123!', { type: argon2.argon2id });

    // 1. Seed Users
    const usersToSeed = [
      { name: 'Sarah Connor', email: 'sarah.host@skillnest.dev', role: UserRole.USER },
      { name: 'Marcus Vance', email: 'marcus.host@skillnest.dev', role: UserRole.USER },
      { name: 'Elena Rostova', email: 'elena.member@skillnest.dev', role: UserRole.USER },
      { name: 'Kenji Sato', email: 'kenji.member@skillnest.dev', role: UserRole.USER },
    ];

    const usersMap: Record<string, Types.ObjectId> = {};
    for (const u of usersToSeed) {
      let existing = await usersRepo.findByEmail(u.email);
      if (!existing) {
        existing = await usersRepo.create({
          name: u.name,
          email: u.email,
          passwordHash: pwdHash,
          role: u.role,
          providers: [AuthProvider.LOCAL],
          isActive: true,
          emailVerified: true,
        });
      }
      usersMap[u.email] = existing._id;
    }
    logger.log('Demo users seeded.');

    // 2. Demo Groups
    const demoGroups = [
      {
        name: 'Silicon Valley Robotics Workshop',
        slug: 'silicon-valley-robotics-workshop',
        description: 'Hands-on embedded systems, ROS2, and Raspberry Pi autonomous rovers workshop for all skill levels.',
        category: GroupCategory.TECH_CODING,
        location: 'San Jose Innovation Lab',
        maxMembers: 12,
        hostEmail: 'sarah.host@skillnest.dev',
        color: { r: 30, g: 64, b: 175, alpha: 1 },
      },
      {
        name: 'Artisan Coffee Roasting & Pour-Over Lab',
        slug: 'artisan-coffee-roasting-lab',
        description: 'Master bean origin profiling, light roast development, and precision extraction chemistry.',
        category: GroupCategory.COOKING,
        location: 'Mission Roastery Studio',
        maxMembers: 8,
        hostEmail: 'marcus.host@skillnest.dev',
        color: { r: 180, g: 83, b: 9, alpha: 1 },
      },
      {
        name: 'Golden Gate Golden Hour Photography',
        slug: 'golden-gate-photography',
        description: 'Twilight long exposure, architectural framing, and mirrorless technique walking workshop.',
        category: GroupCategory.PHOTOGRAPHY,
        location: 'Presidio Lookout, SF',
        maxMembers: 10,
        hostEmail: 'sarah.host@skillnest.dev',
        color: { r: 13, g: 148, b: 136, alpha: 1 },
      },
      {
        name: 'Next-Gen Indie Game Dev Sprint',
        slug: 'indie-game-dev-sprint',
        description: 'Collaborative Godot 4 & Unity shader game development meetups with weekly code reviews.',
        category: GroupCategory.VIDEO_GAMING,
        location: 'Downtown Co-Working Lounge',
        maxMembers: 15,
        hostEmail: 'marcus.host@skillnest.dev',
        color: { r: 124, g: 58, b: 237, alpha: 1 },
      },
    ];

    for (const g of demoGroups) {
      const existing = await groupsRepo.findBySlugOrId(g.slug);
      if (existing) {
        logger.log(`Group '${g.name}' already exists. Skipping.`);
        continue;
      }

      const hostId = usersMap[g.hostEmail];
      // Generate WebP placeholder cover
      const buffer = await sharp({
        create: {
          width: 800,
          height: 450,
          channels: 4,
          background: g.color,
        },
      })
        .webp()
        .toBuffer();

      const uploaded = await mediaService.validateAndUpload(
        {
          buffer,
          size: buffer.length,
          originalname: `${g.slug}-cover.webp`,
          mimetype: 'image/webp',
        } as Express.Multer.File,
        hostId.toString(),
        MediaPurpose.GROUP_COVER,
      );

      const group = await groupsRepo.create({
        name: g.name,
        slug: g.slug,
        description: g.description,
        category: g.category,
        location: g.location,
        coverMediaId: new Types.ObjectId(uploaded.id),
        maxMembers: g.maxMembers,
        memberCount: 1,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        hostId,
        status: GroupStatus.ACTIVE,
      });

      await groupsRepo.createHostMembership(group._id, hostId);

      // Add Elena as member
      const elenaId = usersMap['elena.member@skillnest.dev'];
      await groupsRepo.joinGroupAtomic(group._id, elenaId);

      // Add demo comment from Elena
      const comment = await commentsRepo.createComment({
        groupId: group._id,
        authorId: elenaId,
        body: 'Super excited to attend! Will workshop materials be available beforehand?',
      });

      // Add demo reply from Sarah or Marcus (the host)
      await commentsRepo.createReply({
        commentId: comment._id,
        groupId: group._id,
        authorId: hostId,
        body: 'Yes! We will post downloadable PDF guides and project repos 48h before the event.',
      });

      logger.log(`Created group: ${g.name} with cover, members, and comments.`);
    }

    logger.log('Seed completed successfully!');
  } catch (error) {
    logger.error('Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
