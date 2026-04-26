export interface CreateSnippetRequest {
  workspaceId: string;
  authorId: string;
  title: string;
  language: string;
  content: string;
  extension?: string;
}

export interface UpdateSnippetRequest {
  id: string;
  title?: string;
  language?: string;
  content?: string;
  extension?: string;
  lastEditedById?: string;
}
