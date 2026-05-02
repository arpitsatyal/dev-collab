import { InferInsertModel } from 'drizzle-orm';
import { workspaces } from 'src/common/drizzle/schema';

export type Workspace = InferInsertModel<typeof workspaces>;

export abstract class WorkspaceActionsPort {
  abstract createWorkspace(
    data: { title: string; description?: string },
    user: { id: string },
  ): Promise<any>;

  abstract getWorkspace(id: string): Promise<any>;
}
