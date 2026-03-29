import { Controller, Post, Body, Res } from '@nestjs/common';

import { CollaborationPort } from './ports/collaboration.port';
import { Response } from 'express';
import { CurrentUser } from '../users/user.decorator';
import { CollaborationUserDto } from './dto/collaboration-user.dto';

@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationPort: CollaborationPort) { }

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
