import {
  CollabAuthResponse,
  CollabCommentParams,
  CollabUser,
} from '../types/collaboration.types';

export abstract class CollaborationPort {
  abstract authorizeRoom(
    user: CollabUser,
    room: string,
    permissions?: string[],
  ): Promise<CollabAuthResponse>;

  abstract getYdocContent(roomId: string): Promise<string | null>;

  abstract getComment(params: CollabCommentParams): Promise<any>;
}
