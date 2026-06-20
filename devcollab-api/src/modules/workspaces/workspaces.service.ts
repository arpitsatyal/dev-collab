import { Injectable, NotFoundException } from '@nestjs/common';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceImportRepository } from './repositories/workspace-import.repository';
import { SourceCodePort } from './ports/source-code.port';
import { WorkspaceFileProcessor } from './utils/workspace-file.processor';
import type {
  CreateWorkspaceRequest,
  GetWorkspacesRequest,
  ImportRepositoryRequest,
  TogglePinRequest,
  UserContext,
} from './types/workspaces.types';
import { WorkspaceActionsPort } from './ports/workspace-actions.port';

@Injectable()
export class WorkspacesService implements WorkspaceActionsPort {
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

  async getWorkspaces(request: GetWorkspacesRequest) {
    const { skip, take, user } = request;
    return this.workspaceRepo.findManyRaw(user.id, skip, take);
  }

  async addNewWorkspace(request: CreateWorkspaceRequest) {
    const { user, ...rest } = request;
    const workspace = await this.workspaceRepo.create({
      ...rest,
      ownerId: user.id,
    });

    await this.syncPort.publishSyncEvent('workspace', workspace);
    return workspace;
  }

  async createWorkspace(
    data: { title: string; description?: string },
    user: UserContext,
  ) {
    return this.addNewWorkspace({ ...data, user });
  }

  async togglePinWorkspace(request: TogglePinRequest) {
    const { isPinned, user, workspaceId } = request;

    if (isPinned) {
      await this.workspaceRepo.upsertPin(user.id, workspaceId);
    }
    await this.workspaceRepo.deletePin(user.id, workspaceId);

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

  async importRepository(request: ImportRepositoryRequest) {
    const { url, selectedFiles, user } = request;

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
