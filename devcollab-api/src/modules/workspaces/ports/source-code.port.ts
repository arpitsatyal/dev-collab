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

export interface SourceCodeFile {
  path: string;
  fileName: string;
  ext?: string;
  content: string;
}

export abstract class SourceCodePort {
  abstract getRepoDetails(url: string): Promise<GitRepoDetails>;
  abstract getRepoTree(details: GitRepoDetails): Promise<RepoTreeFile[]>;
  abstract fetchFileContent(
    details: GitRepoDetails,
    path: string,
  ): Promise<string | null>;

  abstract fetchFiles(
    details: GitRepoDetails,
    paths: string[],
  ): Promise<SourceCodeFile[]>;
}
