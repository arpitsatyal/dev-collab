export interface GetWorkspacesRequest {
  skip?: number;
  take?: number;
  user: { id: string };
}

export interface UserContext {
  id: string;
}

export interface CreateWorkspaceRequest {
  title: string;
  description?: string;
  user: UserContext;
}

export interface TogglePinRequest {
  isPinned: boolean;
  user: UserContext;
  workspaceId: string;
}

export interface ImportRepositoryRequest {
  url: string;
  selectedFiles: string[];
  user: UserContext;
}

export interface SnippetImportData {
  title: string;
  language: string;
  extension: string;
  content: string;
  workspaceId: string;
  authorId?: string;
}

export interface DocImportData {
  label: string;
  workspaceId: string;
  roomId: string;
  content?: unknown;
}

export interface ProcessedFiles {
  snippetsData: SnippetImportData[];
  docsData: DocImportData[];
}
