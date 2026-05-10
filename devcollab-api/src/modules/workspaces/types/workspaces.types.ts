export interface CreateWorkspaceRequest {
  title: string;
  description?: string;
  user: any;
}

export interface GetWorkspacesRequest {
  user: { id: string };
  skip?: number;
  take?: number;
}

export interface TogglePinRequest {
  workspaceId: string;
  isPinned: boolean;
  user: { id: string };
}

export interface ImportRepositoryRequest {
  url: string;
  selectedFiles: string[];
  user: { id: string };
}

export interface UserContext {
  id: string;
  email: string;
}

export interface ProcessedFiles {
  snippetsData: any[];
  docsData: any[];
}

export interface SnippetImportData {
  title: string;
  content: string;
  language: string;
  extension: string;
  workspaceId: string;
  authorId: string;
}

export interface DocImportData {
  label: string;
  workspaceId: string;
  roomId: string;
  content: any;
}
