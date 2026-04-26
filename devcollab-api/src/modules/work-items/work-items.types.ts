export interface CreateWorkItemRequest {
  workspaceId: string;
  authorId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: string;
  assignedToId?: string;
  snippetIds?: string[];
}

export interface UpdateWorkItemStatusRequest {
  id: string;
  status: string;
}
