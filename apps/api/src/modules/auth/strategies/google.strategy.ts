import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientId = configService.get<string>('oauth.google.clientId') || 'mock_google_client_id';
    const clientSecret = configService.get<string>('oauth.google.clientSecret') || 'mock_google_secret';
    const callbackURL = configService.get<string>('oauth.google.callbackUrl') || 'http://localhost:3000/api/v1/auth/google/callback';

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; displayName: string; emails?: Array<{ value: string }> },
    done: VerifyCallback,
  ): Promise<void> {
    const { id, displayName, emails } = profile;
    const email = emails?.[0]?.value || null;

    const user = {
      provider: 'google' as const,
      providerId: id,
      email,
      name: displayName || 'Google User',
    };

    done(null, user);
  }
}
