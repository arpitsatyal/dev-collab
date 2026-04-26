export interface CreateDocRequest {
  workspaceId: string;
  label: string;
  content?: any;
}

export interface UpdateDocRequest {
  id: string;
  content: any;
}
