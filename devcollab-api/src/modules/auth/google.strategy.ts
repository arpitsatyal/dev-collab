import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { Profile } from 'passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private userService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: 'http://localhost:4000/api/auth/google/redirect',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, displayName } = profile || {};
    const email = emails?.[0]?.value;

    if (!email) {
      throw new NotFoundException('No email found. Exiting...');
    }

    let user = await this.userService.findByEmail(email);

    if (!user) {
      user = await this.userService.createUser({
        email,
        name: displayName,
        provider: 'GOOGLE',
        image: profile['_json']?.picture ?? null,
      });
    }

    done(null, user);
  }
}
