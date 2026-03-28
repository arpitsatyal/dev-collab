import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { Profile } from 'passport';
import { Strategy } from 'passport-github';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private userService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: 'http://localhost:4000/api/auth/callback/github',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done,
  ) {
    const email = profile?.emails?.[0]?.value;

    if (!email) {
      throw new NotFoundException('No email found. Exiting...');
    }

    let user = await this.userService.findByEmail(email);

    if (!user) {
      user = await this.userService.createUser({
        email,
        name: profile.displayName ?? profile.username,
        image: profile.photos?.[0]?.value,
        provider: 'GITHUB',
      });
    }

    done(null, user);
  }
}
