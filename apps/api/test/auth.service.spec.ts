import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import * as argon2 from 'argon2';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersRepository } from '../src/modules/users/users.repository';
import { AuthRepository } from '../src/modules/auth/auth.repository';
import { MailService } from '../src/mail/mail.service';
import { UserRole, AuthProvider } from '@skillnest/shared';
import { UserDocument } from '../src/modules/users/schemas/user.schema';

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUserId = new Types.ObjectId();
  const mockUser = {
    _id: mockUserId,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: UserRole.USER,
    providers: [AuthProvider.LOCAL],
    isActive: true,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as UserDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findByEmailWithPassword: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            updateById: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            createRefreshSession: jest.fn(),
            findRefreshSessionByHash: jest.fn(),
            revokeSession: jest.fn(),
            revokeFamily: jest.fn(),
            revokeAllUserSessions: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_access_token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'jwt.accessSecret') return 'test_secret';
              if (key === 'jwt.accessTtl') return '15m';
              return null;
            }),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should throw ConflictException if user email already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register(
          { name: 'Test', email: 'test@example.com', password: 'Password123' },
          'agent',
          '127.0.0.1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should register a new user and return tokens', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser);
      authRepository.createRefreshSession.mockResolvedValue({} as any);

      const result = await authService.register(
        { name: 'Test User', email: 'test@example.com', password: 'Password123' },
        'agent',
        '127.0.0.1',
      );

      expect(result).toHaveProperty('accessToken', 'mock_access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('refresh token rotation and reuse detection', () => {
    it('should rotate token when a valid session is refreshed', async () => {
      const validSession = {
        _id: new Types.ObjectId(),
        userId: mockUserId,
        familyId: 'family_123',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1000000),
      };

      authRepository.findRefreshSessionByHash.mockResolvedValue(validSession as any);
      usersRepository.findById.mockResolvedValue(mockUser);
      authRepository.revokeSession.mockResolvedValue(undefined);
      authRepository.createRefreshSession.mockResolvedValue({} as any);

      const result = await authService.refreshTokens('some_valid_refresh_token', 'agent', '127.0.0.1');

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.refreshToken).toBeDefined();
      expect(authRepository.revokeSession).toHaveBeenCalledWith(validSession._id, expect.any(String));
      expect(authRepository.createRefreshSession).toHaveBeenCalledWith(
        expect.objectContaining({ familyId: 'family_123' }),
      );
    });

    it('should detect reuse and revoke entire family if session was already revoked', async () => {
      const revokedSession = {
        _id: new Types.ObjectId(),
        userId: mockUserId,
        familyId: 'compromised_family_456',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000000),
      };

      authRepository.findRefreshSessionByHash.mockResolvedValue(revokedSession as any);

      await expect(
        authService.refreshTokens('stolen_replayed_token', 'agent', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(authRepository.revokeFamily).toHaveBeenCalledWith('compromised_family_456');
    });
  });
});
