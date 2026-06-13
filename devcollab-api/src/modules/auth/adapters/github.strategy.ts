import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthPort } from '../ports/auth.port';
import { Profile } from 'passport';
import { Strategy } from 'passport-github';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private authService: AuthPort,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${configService.getOrThrow<string>('API_URL')}/api/auth/callback/github`,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile?.emails?.[0]?.value;

    if (!email) {
      throw new NotFoundException('No email found in GitHub profile');
    }

    return await this.authService.validateSocialUser({
      email,
      name: profile.displayName ?? profile.username,
      provider: 'GITHUB',
      providerId: profile.id,
      image: profile.photos?.[0]?.value,
    });
  }
}
