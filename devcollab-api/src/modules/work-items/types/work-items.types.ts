import { WorkItemStatus } from 'src/common/drizzle/schema/enums';
export { WorkItemStatus };

export interface CreateWorkItemRequest {
  title: string;
  description?: string;
  status?: WorkItemStatus;
  workspaceId: string;
  authorId: string;
  assignedToId?: string;
  dueDate?: Date;
  snippetIds?: string[];
}

export interface UpdateWorkItemStatusRequest {
  id: string;
  status: WorkItemStatus;
}
