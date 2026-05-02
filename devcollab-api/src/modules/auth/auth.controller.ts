import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/modules/users/user.decorator';
import { User } from 'src/common/drizzle/schema';
import { AuthenticatedRequest } from 'src/common/interfaces/AuthenticatedRequest';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthPort } from './ports/auth.port';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthPort,
  ) { }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() { }

  @Public()
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    await this.authService.handleSocialLogin(req);
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
    await this.authService.handleSocialLogin(req);
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
    await this.authService.logout(req, res);
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }
}
