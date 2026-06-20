import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthPort } from '../ports/auth.port';
import { Profile } from 'passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthPort,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${configService.getOrThrow<string>('API_URL')}/api/auth/google/redirect`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const { emails, displayName, photos } = profile || {};
    const email = emails?.[0]?.value;

    if (!email) {
      throw new NotFoundException('No email found in Google profile');
    }

    return await this.authService.validateSocialUser({
      email,
      name: displayName,
      provider: 'GOOGLE',
      providerId: profile.id,
      image: photos?.[0]?.value ?? profile['_json']?.picture,
    });

  }
}
