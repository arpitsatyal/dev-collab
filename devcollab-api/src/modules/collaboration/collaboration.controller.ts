import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { CollaborationPort } from './ports/collaboration.port';
import { Response } from 'express';
import { CurrentUser } from '../users/user.decorator';
import { CollaborationUserDto } from './collaboration-user.dto';

@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationPort: CollaborationPort) {}

  @UseGuards(SessionAuthGuard)
  @Post('auth')
  async authorize(
    @CurrentUser() user: CollaborationUserDto,
    @Body('room') room: string,
    @Res() res: Response,
  ) {
    const { body, status } = await this.collaborationPort.authorizeRoom(
      user,
      room,
    );

    return res.status(status).json(body);
  }
}
