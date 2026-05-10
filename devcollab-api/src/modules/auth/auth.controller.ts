import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/modules/users/user.decorator';
import { User } from 'src/common/drizzle/schema';
import { AuthenticatedRequest } from 'src/common/types/AuthenticatedRequest';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService
  ) { }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() { }

  @Public()
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    await this.handleLogin(req);
    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL')}/dashboard`,
    );
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() { }

  @Public()
  @Get('callback/github')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    await this.handleLogin(req);
    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL')}/dashboard`,
    );
  }

  @Get('me')
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Public()
  @Get('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      // 1. Passport logout
      await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
          if (err) reject(new UnauthorizedException('Failed to logout'));
          else resolve();
        });
      });

      // 2. Destroy session
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) reject(new UnauthorizedException('Failed to destroy session'));
          else resolve();
        });
      });

      // 3. Clear cookie
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
      });

      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      throw error;
    }
  }

  private async handleLogin(req: AuthenticatedRequest): Promise<void> {
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
}
