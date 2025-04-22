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

export interface Snippet {
  id: string;
  title: string;
  language: string;
  content: string;
  projectId: string;
}

export interface Project {
  title: string;
  id: string;
  snippets?: Snippet[];
}
