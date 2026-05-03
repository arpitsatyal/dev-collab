import { Injectable, Logger } from '@nestjs/common';
import { Liveblocks } from '@liveblocks/node';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { CollaborationPort } from './ports/collaboration.port';

@Injectable()
export class LiveblocksAdapter implements CollaborationPort {
  private readonly logger = new Logger(LiveblocksAdapter.name);
  private readonly liveblocks: Liveblocks;

  constructor(private readonly configService: ConfigService) {
    this.liveblocks = new Liveblocks({
      secret: this.configService.getOrThrow<string>('LIVEBLOCKS_SECRET_KEY'),
    });
  }

  async authorizeRoom(
    user: { id?: string; email?: string; name?: string; image?: string },
    room: string,
    permissions: string[] = [],
  ): Promise<{ body: any; status: number }> {
    const userId = user.id || user.email || 'anonymous';
    const userInfo = {
      name: user.name || '',
      email: user.email || '',
      avatar: user.image || '',
      color: '#0074C2',
    };

    const session = this.liveblocks.prepareSession(userId, { userInfo });

    // Apply permissions passed from the domain service
    for (const permission of permissions) {
      session.allow(room, permission as any);
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
      this.logger.error(
        `Failed to fetch YDoc for room ${roomId}: ${error?.message || error}`,
      );
      return null;
    }
  }

  async getComment(params: {
    roomId: string;
    threadId: string;
    commentId: string;
  }): Promise<any> {
    try {
      return await this.liveblocks.getComment(params);
    } catch (error) {
      this.logger.error(`Failed to fetch comment: ${error?.message || error}`);
      return null;
    }
  }
}
