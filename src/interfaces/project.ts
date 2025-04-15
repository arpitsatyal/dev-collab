export interface Project {
  title: string;
  id: string;
}

export interface Snippet {
  title: string;
  language: string;
  content: string;
  projectId: string;
}
