import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { Types } from 'mongoose';
import { UsersRepository } from '../users/users.repository';
import { AuthRepository } from './auth.repository';
import { MailService } from '../../mail/mail.service';
import { UserMapper } from '../users/dto/user.mapper';
import { UserRole, AuthProvider, UserResponse } from '@skillnest/shared';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { UserDocument } from '../users/schemas/user.schema';

export interface AuthTokensResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateAccessToken(user: UserDocument): string {
    return this.jwtService.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: (this.configService.get<string>('jwt.accessTtl') || '15m') as any,
      },
    );
  }

  private async createRefreshSession(
    userId: Types.ObjectId,
    familyId: string,
    userAgent: string,
    ip: string,
  ): Promise<string> {
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const ttlDays = 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshSession({
      userId,
      tokenHash,
      familyId,
      userAgent,
      ip,
      expiresAt,
    });

    return rawRefreshToken;
  }

  async register(dto: RegisterDto, userAgent: string, ip: string): Promise<AuthTokensResult> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      providers: [AuthProvider.LOCAL],
      role: UserRole.USER,
      isActive: true,
      emailVerified: false,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshSession(user._id, nanoid(16), userAgent, ip);

    return { accessToken, refreshToken, user: UserMapper.toResponse(user) };
  }

  async login(dto: LoginDto, userAgent: string, ip: string): Promise<AuthTokensResult> {
    const user = await this.usersRepository.findByEmailWithPassword(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshSession(user._id, nanoid(16), userAgent, ip);

    return { accessToken, refreshToken, user: UserMapper.toResponse(user) };
  }

  async refreshTokens(rawOldToken: string, userAgent: string, ip: string): Promise<AuthTokensResult> {
    if (!rawOldToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawOldToken);
    const session = await this.authRepository.findRefreshSessionByHash(tokenHash);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    // Reuse detection: if rotated token is presented again, revoke entire family
    if (session.revokedAt) {
      await this.authRepository.revokeFamily(session.familyId);
      throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked.');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.usersRepository.findById(session.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account no longer active');
    }

    // Rotate token
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    await this.authRepository.revokeSession(session._id, newTokenHash);

    const ttlDays = 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    await this.authRepository.createRefreshSession({
      userId: user._id,
      tokenHash: newTokenHash,
      familyId: session.familyId,
      userAgent,
      ip,
      expiresAt,
    });

    const accessToken = this.generateAccessToken(user);
    return { accessToken, refreshToken: newRawRefreshToken, user: UserMapper.toResponse(user) };
  }

  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    const session = await this.authRepository.findRefreshSessionByHash(tokenHash);
    if (session && !session.revokedAt) {
      await this.authRepository.revokeSession(session._id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.revokeAllUserSessions(new Types.ObjectId(userId));
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository.findByIdWithPassword(userId);
    if (!user || !user.passwordHash) {
      throw new BadRequestException('User does not have a local password');
    }

    const matches = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!matches) {
      throw new BadRequestException('Current password does not match');
    }

    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.usersRepository.updateById(userId, { passwordHash });
    await this.authRepository.revokeAllUserSessions(user._id);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user || !user.isActive) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.usersRepository.updateById(user._id, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    });

    await this.mailService.sendPasswordResetEmail(user.email, rawToken);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);
    const user = await this.usersRepository.findByResetTokenHash(tokenHash);
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.usersRepository.updateById(user._id, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    });

    await this.authRepository.revokeAllUserSessions(user._id);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserResponse> {
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.avatarMediaId !== undefined) {
      updateData.avatarMediaId = dto.avatarMediaId ? new Types.ObjectId(dto.avatarMediaId) : null;
    }

    const updated = await this.usersRepository.updateById(userId, updateData);
    if (!updated) throw new BadRequestException('Could not update profile');
    return UserMapper.toResponse(updated);
  }

  async handleOAuthUser(profile: {
    provider: 'google' | 'github';
    providerId: string;
    email: string;
    name: string;
  }): Promise<string> {
    let user = await this.usersRepository.findByProviderId(profile.provider, profile.providerId);
    if (!user) {
      user = await this.usersRepository.findByEmail(profile.email);
      if (user) {
        const providers = [...new Set([...user.providers, profile.provider as AuthProvider])];
        const providerIds = { ...user.providerIds, [profile.provider]: profile.providerId };
        user = await this.usersRepository.updateById(user._id, { providers, providerIds });
      } else {
        user = await this.usersRepository.create({
          name: profile.name,
          email: profile.email.toLowerCase().trim(),
          providers: [profile.provider as AuthProvider],
          providerIds: { [profile.provider]: profile.providerId },
          role: UserRole.USER,
          isActive: true,
          emailVerified: true,
        });
      }
    }

    if (!user || !user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const exchangeCode = nanoid(32);
    await this.authRepository.createOAuthCode(user._id, exchangeCode, 300);
    return exchangeCode;
  }

  async exchangeOAuthCode(code: string, userAgent: string, ip: string): Promise<AuthTokensResult> {
    const oauthCode = await this.authRepository.consumeOAuthCode(code);
    if (!oauthCode) {
      throw new BadRequestException('Invalid or expired OAuth exchange code');
    }

    const user = await this.usersRepository.findById(oauthCode.userId);
    if (!user || !user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshSession(user._id, nanoid(16), userAgent, ip);
    return { accessToken, refreshToken, user: UserMapper.toResponse(user) };
  }
}
