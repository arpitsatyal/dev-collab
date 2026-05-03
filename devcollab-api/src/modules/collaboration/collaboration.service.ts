import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CollaborationPort } from './ports/collaboration.port';
import {
  CollabCommentParams,
  CollabUser,
} from './interfaces/collaboration.interfaces';

@Injectable()
export class CollaborationService {
  constructor(private readonly collaborationPort: CollaborationPort) {}

  async authorizeRoom(user: CollabUser, room: string) {
    if (!user) {
      throw new UnauthorizedException();
    }

    const allowedPrefixes = [
      `snippet_`,
      `snippet_draft_`,
      `playground_`,
      `docs_`,
    ];

    const isAllowedRoom =
      typeof room === 'string' &&
      allowedPrefixes.some((prefix) => room.startsWith(prefix));

    const permissions = isAllowedRoom ? ['room:write'] : [];

    return this.collaborationPort.authorizeRoom(user, room, permissions);
  }

  async getYdocContent(roomId: string): Promise<string | null> {
    return this.collaborationPort.getYdocContent(roomId);
  }

  async getComment(params: CollabCommentParams): Promise<any> {
    return this.collaborationPort.getComment(params);
  }
}
