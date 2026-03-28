import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../users/user.decorator';
import { User } from 'src/common/drizzle/schema';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/AuthenticatedRequest';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private configService: ConfigService) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    req.logIn(req.user, (err) => {
      if (err) {
        throw new UnauthorizedException('Failed to log in');
      }
      req.session.save((err) => {
        if (err) {
          throw new UnauthorizedException('Failed to save session');
        }
        res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/dashboard`);
      });
    });
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {}

  @Get('callback/github')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req, @Res() res) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    req.logIn(req.user, (err) => {
      if (err) {
        throw new UnauthorizedException('Failed to log in');
      }
      req.session.save((err) => {
        if (err) {
          throw new UnauthorizedException('Failed to save session');
        }
        res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/dashboard`);
      });
    });
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      // Promisify the logout function
      await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
          if (err) {
            reject(new UnauthorizedException('Failed to logout'));
          } else {
            resolve();
          }
        });
      });

      // Promisify the session destroy function
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((error) => {
          if (error) {
            reject(new UnauthorizedException('Failed to destroy session'));
          } else {
            resolve();
          }
        });
      });

      // Clear the session cookie
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
      });

      // Send success response
      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      throw error;
    }
  }
}
