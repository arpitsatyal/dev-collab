import { CreateDocRequest, UpdateDocRequest } from 'src/modules/docs/docs.types';
import { CreateSnippetRequest } from 'src/modules/snippets/snippets.types';
import { CreateWorkItemRequest, UpdateWorkItemStatusRequest } from 'src/modules/work-items/work-items.types';
import { CreateWorkspaceRequest } from 'src/modules/workspaces/workspaces.types';

export interface SearchWorkspacesArgs {
  query?: string;
}

export interface GetSnippetsArgs {
  titleFilter?: string;
  workspaceId?: string;
}

export interface GetDocsArgs {
  labelFilter?: string;
  workspaceId?: string;
}

export interface GetWorkItemsArgs {
  titleFilter?: string;
  workspaceId?: string;
}

export interface SemanticSearchArgs {
  query: string;
  workspaceId?: string;
}

export interface CreateSnippetArgs
  extends Omit<CreateSnippetRequest, 'authorId' | 'workspaceId'> {
  workspaceId?: string;
}

export interface CreateWorkItemArgs
  extends Omit<CreateWorkItemRequest, 'authorId' | 'workspaceId'> {
  workspaceId?: string;
}

export interface UpdateWorkItemArgs
  extends Partial<Omit<CreateWorkItemRequest, 'authorId' | 'workspaceId'>> {
  id: string;
}

export interface CreateDocArgs extends Omit<CreateDocRequest, 'workspaceId'> {
  workspaceId?: string;
}

export interface UpdateDocArgs extends UpdateDocRequest {}

export interface CreateWorkspaceArgs extends Omit<CreateWorkspaceRequest, 'user'> {}
