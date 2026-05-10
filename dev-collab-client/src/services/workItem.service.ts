import { WorkItem, WorkItemCreateData } from "../types";
import { OptimisticUtils } from "../utils/optimistic";

export const WorkItemService = {
  /**
   * Creates an optimistic work item object for UI updates.
   */
  createOptimisticWorkItem(data: WorkItemCreateData, workspaceId: string): WorkItem {
    const { snippetIds, ...fields } = data;
    const now = OptimisticUtils.now();
    
    return {
      title: fields.title,
      description: fields.description || null,
      id: OptimisticUtils.generateTempId(),
      workspaceId,
      createdAt: now,
      updatedAt: now,
      status: data.status || "TODO",
      assignedToId: fields.assignedToId || null,
      authorId: null,
      dueDate: fields.dueDate || null,
      aiPlan: null,
    } as WorkItem;
  }
};
