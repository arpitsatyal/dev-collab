import { WorkspaceWithPin } from "../types";

export const WorkspaceService = {
  /**
   * Sorts workspaces based on pinned status and creation date.
   * Business rule: Pinned items first, then most recent.
   */
  sortWorkspaces(workspaces: WorkspaceWithPin[]): WorkspaceWithPin[] {
    return [...workspaces].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }
};
