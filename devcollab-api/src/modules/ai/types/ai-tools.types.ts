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

export interface CreateSnippetArgs {
  title: string;
  language: string;
  content: string;
  workspaceId?: string;
}

export interface CreateWorkItemArgs {
  title: string;
  description?: string;
  status?: string;
  workspaceId?: string;
}

export interface UpdateWorkItemArgs {
  id: string;
  title?: string;
  description?: string;
  status?: string;
}

export interface CreateDocArgs {
  label: string;
  content?: any;
  workspaceId?: string;
}

export interface UpdateDocArgs {
  id: string;
  content: any;
}

export interface CreateWorkspaceArgs {
  title: string;
  description?: string;
}
