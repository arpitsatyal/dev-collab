import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateWorkspaceDto,
  ImportRepositoryDto,
  TogglePinDto,
} from './dto/workspaces.dto';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { WorkspaceRepository } from './adapters/workspace.repository';
import { WorkspaceImportRepository } from './adapters/workspace-import.repository';
import { SourceCodePort } from './ports/source-code.port';
import { WorkspaceFileProcessor } from './utils/workspace-file.processor';
import { WorkspaceActionsPort } from 'src/common/ports/workspace-actions.port';
import { CreateWorkspaceData, GetWorkspacesParams, UserContext } from './workspaces.types';

@Injectable()
export class WorkspacesService implements WorkspaceActionsPort {
  constructor(
    private syncPort: SyncEventPort,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly importRepo: WorkspaceImportRepository,
    private readonly sourceCodeClient: SourceCodePort,
  ) {}

  async getWorkspace(id: string) {
    const workspace = await this.workspaceRepo.findById(id);
    if (!workspace)
      throw new NotFoundException(`Workspace with id ${id} not found`);
    return workspace;
  }

  async getAllWorkspaces(skip = 0, take = 20) {
    return this.workspaceRepo.findPaginated(skip, take);
  }

  async getWorkspaces(params: GetWorkspacesParams) {
    const { skip, take, user } = params;
    return this.workspaceRepo.findManyRaw(user.id, skip, take);
  }

  async addNewWorkspace(dto: CreateWorkspaceDto, user: UserContext) {
    const workspace = await this.workspaceRepo.create({
      title: dto.title,
      description: dto.description,
      ownerId: user.id,
    });

    await this.syncPort.publishSyncEvent('workspace', workspace);
    return workspace;
  }

  /**
   * Fulfillment for WorkspaceActionsPort
   */
  async createWorkspace(data: CreateWorkspaceData, user: UserContext) {
    return this.addNewWorkspace(data, user);
  }

  async togglePinWorkspace(
    dto: TogglePinDto,
    user: UserContext,
    workspaceId: string,
  ) {
    const { isPinned } = dto;

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

  async importRepository(
    params: ImportRepositoryDto & { user: UserContext },
  ) {
    const { url, selectedFiles, user } = params;

    const repoDetails = await this.sourceCodeClient.getRepoDetails(url);

    const workspace = await this.workspaceRepo.create({
      title: repoDetails.repo,
      description: repoDetails.description,
      ownerId: user.id,
    });

    const fetchResults = await this.sourceCodeClient.fetchFiles(
      repoDetails,
      selectedFiles,
    );

    const { snippetsData, docsData } = WorkspaceFileProcessor.processFiles(
      fetchResults,
      workspace.id,
      user.id,
    );

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
