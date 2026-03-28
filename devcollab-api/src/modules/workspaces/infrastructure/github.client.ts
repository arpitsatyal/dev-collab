import { Injectable, BadRequestException } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { SourceCodePort, GitRepoDetails, RepoTreeFile } from '../ports/source-code.port';

@Injectable()
export class GithubClient implements SourceCodePort {
  private readonly octokit = new Octokit();

  private parseGitHubUrl(url: string) {
    const regex = /github\.com\/([^/]+)\/([^/]+)/;
    const match = url.match(regex);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }

  async getRepoDetails(url: string): Promise<GitRepoDetails> {
    const repoDetails = this.parseGitHubUrl(url);
    if (!repoDetails) throw new BadRequestException('Invalid GitHub URL');

    const { data: repoData } = await this.octokit.repos.get({
      owner: repoDetails.owner,
      repo: repoDetails.repo,
    });

    return {
      owner: repoDetails.owner,
      repo: repoDetails.repo,
      defaultBranch: repoData.default_branch,
      description: repoData.description,
    };
  }

  async getRepoTree(details: GitRepoDetails): Promise<RepoTreeFile[]> {
    const { data: treeData } = await this.octokit.git.getTree({
      owner: details.owner,
      repo: details.repo,
      tree_sha: details.defaultBranch,
      recursive: 'true',
    });

    const IGNORED_DIRS = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'out',
    ];
    return treeData.tree
      .filter(
        (item: any) =>
          item.type === 'blob' &&
          !IGNORED_DIRS.some((dir) => item.path?.includes(dir)),
      )
      .map((item: any) => ({
        path: item.path,
        size: item.size,
        url: item.url,
      }));
  }

  async fetchFileContent(details: GitRepoDetails, path: string) {
    const { data: contentData } = await this.octokit.repos.getContent({
      owner: details.owner,
      repo: details.repo,
      path,
      ref: details.defaultBranch,
    });

    if (Array.isArray(contentData) || contentData.type !== 'file') return null;

    return Buffer.from(contentData.content, 'base64').toString('utf-8');
  }
}
