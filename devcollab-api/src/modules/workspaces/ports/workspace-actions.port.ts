export abstract class WorkspaceActionsPort {
  abstract createWorkspace(
    data: { title: string; description?: string },
    user: { id: string },
  ): Promise<any>;

  abstract getWorkspace(id: string): Promise<any>;

  abstract getAllWorkspaces(skip?: number, take?: number): Promise<any[]>;
}

