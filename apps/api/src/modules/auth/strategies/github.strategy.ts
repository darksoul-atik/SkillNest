import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    const clientId = configService.get<string>('oauth.github.clientId') || 'mock_github_client_id';
    const clientSecret = configService.get<string>('oauth.github.clientSecret') || 'mock_github_secret';
    const callbackURL = configService.get<string>('oauth.github.callbackUrl') || 'http://localhost:3000/api/v1/auth/github/callback';

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; displayName?: string; username?: string; emails?: Array<{ value: string }> },
    done: (err: unknown, user?: unknown) => void,
  ): Promise<void> {
    const { id, displayName, username, emails } = profile;
    const email = emails?.[0]?.value || `github_${id}@users.skillnest.dev`;
    const name = displayName || username || `GitHub User ${id}`;

    const user = {
      provider: 'github' as const,
      providerId: id,
      email,
      name,
    };

    done(null, user);
  }
}
