import { Controller, Post, Body, Res } from '@nestjs/common';

import { CollaborationService } from './collaboration.service';
import { Response } from 'express';
import { CurrentUser } from '../users/user.decorator';
import { CollaborationUserDto } from './dto/collaboration-user.dto';

@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('auth')
  async authorize(
    @CurrentUser() user: CollaborationUserDto,
    @Body('room') room: string,
    @Res() res: Response,
  ) {
    const { body, status } = await this.collaborationService.authorizeRoom(
      user,
      room,
    );

    return res.status(status).json(body);
  }
}
