import type {
  CreateDocRequest,
  UpdateDocRequest,
} from 'src/modules/docs/interfaces/docs.interfaces';
import type { CreateSnippetRequest } from 'src/modules/snippets/interfaces/snippets.interfaces';
import type { CreateWorkItemRequest } from 'src/modules/work-items/interfaces/work-items.interfaces';
import type { CreateWorkspaceRequest } from 'src/modules/workspaces/interfaces/workspaces.interfaces';

export interface SearchWorkspacesArgs {
  query?: string;
}

export interface GetWorkspaceOverviewArgs {
  workspaceId?: string;
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
  searchQuery: string;
  workspaceId?: string | null;
}

export interface CreateSnippetArgs extends Omit<
  CreateSnippetRequest,
  'authorId' | 'workspaceId'
> {
  workspaceId?: string;
}

export interface CreateWorkItemArgs extends Omit<
  CreateWorkItemRequest,
  'authorId' | 'workspaceId'
> {
  workspaceId?: string;
}

export interface UpdateWorkItemArgs extends Partial<
  Omit<CreateWorkItemRequest, 'authorId' | 'workspaceId'>
> {
  id: string;
}

export interface CreateDocArgs extends Omit<CreateDocRequest, 'workspaceId'> {
  workspaceId?: string;
}

export interface UpdateDocArgs extends UpdateDocRequest {}

export interface CreateWorkspaceArgs extends Omit<
  CreateWorkspaceRequest,
  'user'
> {}
