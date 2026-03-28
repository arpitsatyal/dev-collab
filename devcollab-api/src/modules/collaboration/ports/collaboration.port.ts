export abstract class CollaborationPort {
  abstract authorizeRoom(
    user: { id?: string; email?: string; name?: string; image?: string },
    room: string,
  ): Promise<{ body: any; status: number }>;

  abstract getYdocContent(roomId: string): Promise<string | null>;

  abstract getComment(params: {
    roomId: string;
    threadId: string;
    commentId: string;
  }): Promise<any>;
}
