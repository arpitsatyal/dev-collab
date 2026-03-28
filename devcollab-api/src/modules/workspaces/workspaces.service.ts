import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/workspaces.dto';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { randomUUID } from 'crypto';
import { WorkspaceRepository } from './infrastructure/workspace.repository';
import { WorkspaceImportRepository } from './infrastructure/workspace-import.repository';
import { SourceCodePort } from './ports/source-code.port';
import { SNIPPET_EXTENSIONS } from './utils/constants';

@Injectable()
export class WorkspacesService {

  constructor(
    private syncPort: SyncEventPort,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly importRepo: WorkspaceImportRepository,
    private readonly sourceCodeClient: SourceCodePort,
  ) { }

  async getWorkspace(id: string) {
    const workspace = await this.workspaceRepo.findById(id);
    if (!workspace)
      throw new NotFoundException(`Workspace with id ${id} not found`);
    return workspace;
  }

  async getAllWorkspaces(skip = 0, take = 20) {
    return this.workspaceRepo.findPaginated(skip, take);
  }

  async getWorkspaces(params: {
    skip?: number;
    take?: number;
    user: { id: string };
  }) {
    const { skip, take, user } = params;
    return this.workspaceRepo.findManyRaw(user.id, skip, take);
  }

  async addNewWorkspace(dto: CreateWorkspaceDto, user: { id: string }) {
    const workspace = await this.workspaceRepo.create({
      title: dto.title,
      description: dto.description,
      ownerId: user.id,
    });

    await this.syncPort.publishSyncEvent('workspace', workspace);
    return workspace;
  }

  async togglePinWorkspace(
    params: { isPinned: boolean },
    user: { id: string },
    workspaceId: string,
  ) {
    const { isPinned } = params;

    if (typeof isPinned !== 'boolean') {
      throw new BadRequestException('isPinned must be a boolean.');
    }

    if (isPinned) {
      await this.workspaceRepo.upsertPin(user.id, workspaceId);
    } else {
      await this.workspaceRepo.deletePin(user.id, workspaceId);
    }

    return { pinned: isPinned };
  }

  async fetchRepoTree(url: string) {
    const repoDetails = await this.sourceCodeClient.getRepoDetails(url);
    const files = await this.sourceCodeClient.getRepoTree(repoDetails);
    return {
      owner: repoDetails.owner,
      repo: repoDetails.repo,
      defaultBranch: repoDetails.defaultBranch,
      files,
      description: repoDetails.description,
    };
  }

  async importRepository(params: {
    url: string;
    selectedFiles: string[];
    user: { id: string };
  }) {
    const { url, selectedFiles, user } = params;
    if (!url) throw new BadRequestException('GitHub URL is required');
    if (!selectedFiles?.length)
      throw new BadRequestException('No files selected for import');

    const repoDetails = await this.sourceCodeClient.getRepoDetails(url);

    const workspace = await this.workspaceRepo.create({
      title: repoDetails.repo,
      description: repoDetails.description,
      ownerId: user.id,
    });

    const fetchResults = await Promise.all(
      selectedFiles.map(async (path) => {
        try {
          const content = await this.sourceCodeClient.fetchFileContent(
            repoDetails,
            path,
          );
          if (!content) return null;
          const ext = path.split('.').pop()?.toLowerCase();
          const fileName = path.split('/').pop() || '';
          return { path, fileName, ext, content };
        } catch (e) {
          console.error(`Failed to fetch ${path}:`, e);
          return null;
        }
      }),
    );

    const snippetsData: {
      title: string;
      language: string;
      extension: string;
      content: string;
      workspaceId: string;
      authorId: string;
    }[] = [];

    const docsData: {
      label: string;
      workspaceId: string;
      roomId: string;
      content: unknown;
    }[] = [];

    for (const result of fetchResults) {
      if (!result) continue;

      if (result.ext === 'md') {
        docsData.push({
          label: result.fileName,
          workspaceId: workspace.id,
          roomId: randomUUID(),
          content: { type: 'doc', content: result.content },
        });
      } else if (SNIPPET_EXTENSIONS.includes(result.ext || '')) {
        snippetsData.push({
          title: result.fileName.replace(`.${result.ext}`, ''),
          language: result.ext || 'plaintext',
          extension: result.ext || '',
          content: JSON.stringify(result.content),
          workspaceId: workspace.id,
          authorId: user.id,
        });
      }
    }

    await this.importRepo.createSnippets(snippetsData);
    await this.importRepo.createDocs(docsData);

    await this.syncPort.publishSyncEvent('workspace', workspace);

    return {
      success: true,
      workspace,
      stats: { snippets: snippetsData.length, docs: docsData.length },
    };
  }
}
