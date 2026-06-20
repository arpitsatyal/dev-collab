export interface CreateDocRequest {
  label: string;
  workspaceId: string;
  roomId?: string;
  content?: any;
}

export interface UpdateDocRequest extends Partial<CreateDocRequest> {
  id: string;
}
