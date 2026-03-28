export interface GitRepoDetails {
  owner: string;
  repo: string;
  defaultBranch: string;
  description?: string | null;
}

export interface RepoTreeFile {
  path: string;
  size: number;
  url: string;
}

export abstract class SourceCodePort {
  abstract getRepoDetails(url: string): Promise<GitRepoDetails>;
  abstract getRepoTree(details: GitRepoDetails): Promise<RepoTreeFile[]>;
  abstract fetchFileContent(details: GitRepoDetails, path: string): Promise<string | null>;
}
