import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { AuthPort } from './ports/auth.port';
import { ValidateSocialUserRequest } from './interfaces/auth.interfaces';
import { Response } from 'express';
import { AuthenticatedRequest } from 'src/common/interfaces/AuthenticatedRequest';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService implements AuthPort {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) { }

  async validateSocialUser(profileData: ValidateSocialUserRequest) {
    const { email, name, provider, providerId, image } = profileData;

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createUser({
        email,
        name,
        provider,
        providerId,
        image,
      });
    }

    return user;
  }

  async handleSocialLogin(req: AuthenticatedRequest): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    return new Promise((resolve, reject) => {
      req.logIn(req.user!, (err) => {
        if (err) return reject(new UnauthorizedException('Failed to log in'));

        req.session.save((err) => {
          if (err) return reject(new UnauthorizedException('Failed to save session'));
          resolve();
        });
      });
    });
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Promisify logout
      await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
          if (err) reject(new UnauthorizedException('Failed to logout'));
          else resolve();
        });
      });

      // Promisify session destroy
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) reject(new UnauthorizedException('Failed to destroy session'));
          else resolve();
        });
      });

      // Clear cookie
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
      });
    } catch (error) {
      throw error;
    }
  }
}
