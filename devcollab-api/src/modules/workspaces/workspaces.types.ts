export interface GetWorkspacesParams {
  skip?: number;
  take?: number;
  user: { id: string };
}

export interface CreateWorkspaceData {
  title: string;
  description?: string;
}

export interface UserContext {
  id: string;
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
