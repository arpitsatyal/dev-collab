export interface CollabUser {
  id?: string;
  email?: string;
  name?: string;
  image?: string;
}

export interface CollabAuthResponse {
  body: any;
  status: number;
}

export interface CollabCommentParams {
  roomId: string;
  threadId: string;
  commentId: string;
}
