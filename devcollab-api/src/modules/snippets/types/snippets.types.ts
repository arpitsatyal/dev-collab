export interface CreateSnippetRequest {
  title: string;
  content: string;
  language: string;
  extension?: string;
  workspaceId: string;
  authorId: string;
}

export interface UpdateSnippetRequest extends Partial<CreateSnippetRequest> {
  id: string;
  lastEditedById?: string;
}
