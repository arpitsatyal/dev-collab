import type {
  CreateDocRequest,
  UpdateDocRequest,
} from 'src/modules/docs/types/docs.types';
import type { CreateSnippetRequest } from 'src/modules/snippets/types/snippets.types';
import type { CreateWorkItemRequest } from 'src/modules/work-items/types/work-items.types';
import type { CreateWorkspaceRequest } from 'src/modules/workspaces/types/workspaces.types';

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

export interface UpdateDocArgs extends UpdateDocRequest { }

export interface CreateWorkspaceArgs extends Omit<
  CreateWorkspaceRequest,
  'user'
> { }
