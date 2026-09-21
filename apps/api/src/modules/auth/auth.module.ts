import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshSession, RefreshSessionSchema } from './schemas/refresh-session.schema';
import { OAuthCode, OAuthCodeSchema } from './schemas/oauth-code.schema';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefreshSession.name, schema: RefreshSessionSchema },
      { name: OAuthCode.name, schema: OAuthCodeSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.accessTtl') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
