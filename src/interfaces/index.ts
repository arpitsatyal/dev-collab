export interface SnippetCreate {
  title: string;
  language: string;
  content: string;
  extension: string;
}

export interface SnippetUpdate {
  title: string;
  language: string;
  content: string;
  lastEditedById: string;
  extension?: string;
}

export interface ProjectCreate {
  title: string;
  id: string;
  description?: string;
}
