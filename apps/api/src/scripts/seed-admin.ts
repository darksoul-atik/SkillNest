import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersRepository } from '../modules/users/users.repository';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UserRole, AuthProvider } from '@skillnest/shared';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedAdmin');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const usersRepository = app.get(UsersRepository);
    const configService = app.get(ConfigService);

    const email = configService.get<string>('admin.email') || 'admin@skillnest.dev';
    const password = configService.get<string>('admin.password') || 'AdminSecurePassword123!';

    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      logger.log(`Admin user '${email}' already exists.`);
      if (existing.role !== UserRole.ADMIN) {
        await usersRepository.updateById(existing._id, { role: UserRole.ADMIN });
        logger.log(`Updated user role to ADMIN.`);
      }
    } else {
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
      await usersRepository.create({
        name: 'SkillNest Administrator',
        email: email.toLowerCase().trim(),
        passwordHash,
        role: UserRole.ADMIN,
        providers: [AuthProvider.LOCAL],
        isActive: true,
        emailVerified: true,
      });
      logger.log(`Admin user '${email}' successfully created.`);
    }
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
