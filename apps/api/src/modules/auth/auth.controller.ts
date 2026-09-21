import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  OAuthExchangeDto,
} from './dto/auth.dto';
import { AuthResponse, UserResponse } from '@skillnest/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string): void {
    const isProd = this.configService.get<string>('app.env') === 'production';
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      path: '/api/v1/auth',
    });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await this.authService.register(dto, userAgent, ip);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await this.authService.login(dto, userAgent, ip);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await this.authService.refreshTokens(token, userAgent, ip);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current session' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const token = req.cookies?.refreshToken;
    await this.authService.logout(token);
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all active sessions' })
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logoutAll(userId);
    this.clearRefreshTokenCookie(res);
    return { message: 'All sessions revoked' };
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async me(@CurrentUser() user: UserResponse): Promise<UserResponse> {
    return user;
  }

  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update profile information' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponse> {
    return this.authService.updateProfile(userId, dto);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(userId, dto);
    return { message: 'Password updated successfully' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If that email exists in our system, a reset link has been dispatched.' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Password has been reset successfully' };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { provider: 'google'; providerId: string; email: string; name: string };
    const code = await this.authService.handleOAuthUser(user);
    const webOrigin = this.configService.get<string>('app.webOrigin') || 'http://localhost:5173';
    return res.redirect(`${webOrigin}/auth/callback?code=${code}`);
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth' })
  githubAuth() {}

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { provider: 'github'; providerId: string; email: string; name: string };
    const code = await this.authService.handleOAuthUser(user);
    const webOrigin = this.configService.get<string>('app.webOrigin') || 'http://localhost:5173';
    return res.redirect(`${webOrigin}/auth/callback?code=${code}`);
  }

  @Public()
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange one-time OAuth code for tokens' })
  async exchangeOAuth(
    @Body() dto: OAuthExchangeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await this.authService.exchangeOAuthCode(dto.code, userAgent, ip);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }
}
