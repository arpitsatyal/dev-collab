import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { WorkspaceRepository } from '../workspaces/adapters/workspace.repository';
import { SnippetRepository } from '../snippets/repositories/snippet.repository';
import { DocRepository } from '../docs/repositories/doc.repository';
import { WorkItemRepository } from '../work-items/repositories/work-item.repository';
import type { CreateUserRequest } from './interfaces/users.interfaces';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly snippetRepo: SnippetRepository,
    private readonly docRepo: DocRepository,
    private readonly workItemRepo: WorkItemRepository,
  ) {}

  async findByEmail(email: string) {
    return this.userRepo.findByEmail(email);
  }

  async findById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`No user found with id: ${id}`);
    return user;
  }

  async findAll() {
    return this.userRepo.findMany();
  }

  async createUser(request: CreateUserRequest) {
    return this.userRepo.create(request);
  }

  async searchByName(name: string) {
    return this.userRepo.searchByName(name);
  }

  async getCollaborationUsers(ids: string[]) {
    return this.userRepo.findByIds(ids);
  }

  async getStatsByEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return this.getStats(user.id);
  }

  async getStats(userId: string) {
    const ownedWorkspaceIds = await this.workspaceRepo.findIdsByOwnerId(userId);

    const [workspaces, snippets, docs, workItems] = await Promise.all([
      this.workspaceRepo.countByOwnerId(userId),
      this.snippetRepo.countByAuthorId(userId),
      this.docRepo.countByWorkspaceIds(ownedWorkspaceIds),
      this.workItemRepo.countByAuthorId(userId),
    ]);

    return {
      workspaces,
      snippets,
      docs,
      workItems,
      totalAssets: snippets + docs + workItems,
    };
  }
}
