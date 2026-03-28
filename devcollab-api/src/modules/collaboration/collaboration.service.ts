import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Liveblocks } from '@liveblocks/node';
import axios from 'axios';
import { CollaborationPort } from './ports/collaboration.port';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CollaborationService implements CollaborationPort {
  private readonly logger = new Logger(CollaborationService.name);
  private readonly liveblocks: Liveblocks;

  constructor(private configService: ConfigService) {
    this.liveblocks = new Liveblocks({
      secret: this.configService.getOrThrow<string>('LIVEBLOCKS_SECRET_KEY'),
    });
  }

  async authorizeRoom(
    user: { id?: string; email?: string; name?: string; image?: string },
    room: string,
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    const userId = user.id || user.email || 'anonymous';
    const userInfo = {
      name: user.name || '',
      email: user.email || '',
      avatar: user.image || '',
      color: '#0074C2',
    };

    const session = this.liveblocks.prepareSession(userId, { userInfo });

    const allowedPrefixes = [
      `snippet_`,
      `snippet_draft_`,
      `playground_`,
      `docs_`,
    ];

    const isAllowedRoom =
      typeof room === 'string' &&
      allowedPrefixes.some((prefix) => room.startsWith(prefix));

    if (isAllowedRoom) {
      session.allow(room, session.FULL_ACCESS);
    }

    const { body, status } = await session.authorize();

    return { body: JSON.parse(body), status };
  }

  async getYdocContent(roomId: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `https://api.liveblocks.io/v2/rooms/${roomId}/ydoc`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('LIVEBLOCKS_SECRET_KEY')}`,
            Accept: 'application/octet-stream',
          },
          responseType: 'arraybuffer',
        },
      );

      return response.data.toString('utf8');
    } catch (error) {
      this.logger.error(`Failed to fetch YDoc for room ${roomId}: ${error?.message || error}`);
      return null;
    }
  }

  async getComment(params: { roomId: string; threadId: string; commentId: string }): Promise<any> {
    try {
      return await this.liveblocks.getComment(params);
    } catch (error) {
      this.logger.error(`Failed to fetch comment: ${error?.message || error}`);
      return null;
    }
  }
}
