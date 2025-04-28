export interface SnippetCreate {
  title: string;
  language: string;
  content: string;
}

export interface SnippetUpdate {
  title: string;
  language: string;
  content: string;
  lastEditedById: string;
}

export interface ProjectCreate {
  title: string;
  id: string;
  description?: string;
}
