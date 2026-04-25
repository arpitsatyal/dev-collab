import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { WorkspaceRepository } from '../workspaces/infrastructure/workspace.repository';
import { SnippetRepository } from '../snippets/repositories/snippet.repository';
import { DocRepository } from '../docs/repositories/doc.repository';
import { WorkItemRepository } from '../work-items/repositories/work-item.repository';
import { users } from 'src/common/drizzle/schema';
import { InferInsertModel } from 'drizzle-orm';

type CreateUserDTO = Omit<
  InferInsertModel<typeof users>,
  'id' | 'createdAt' | 'emailVerified'
>;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly snippetRepo: SnippetRepository,
    private readonly docRepo: DocRepository,
    private readonly workItemRepo: WorkItemRepository,
  ) { }

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

  async searchByName(text: string): Promise<string[]> {
    const decodedText = decodeURIComponent(text).trim().toLowerCase();
    const allUsers = await this.userRepo.findMany();
    return allUsers
      .filter(
        (user) => user.name && user.name.toLowerCase().includes(decodedText),
      )
      .map((user) => user.id);
  }

  async getStatsByEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const workspaceIds = await this.workspaceRepo.findIdsByOwnerId(user.id);

    const [workspacesCount, snippetsCount, docsCount, workItemsCount] =
      await Promise.all([
        this.workspaceRepo.countByOwnerId(user.id),
        this.snippetRepo.countByAuthorId(user.id),
        this.docRepo.countByWorkspaceIds(workspaceIds),
        this.workItemRepo.countByWorkspaceIds(workspaceIds),
      ]);

    return {
      workspaces: workspacesCount,
      snippets: snippetsCount,
      docs: docsCount,
      workItems: workItemsCount,
    };
  }

  async getCollaborationUsers(userIds: string[]) {
    const found = await this.userRepo.findManyByIds(userIds);

    const userMap = new Map(found.map((u) => [u.id, u]));
    return userIds
      .map((id) => userMap.get(id))
      .filter(Boolean)
      .map((user: any) => ({
        id: user?.id ?? user?.email,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        avatar: user?.image || '',
        color: '#0074C2',
      }));
  }

  async createUser(createUserDTO: CreateUserDTO) {
    return this.userRepo.create({
      email: createUserDTO.email,
      name: createUserDTO.name,
      provider: createUserDTO.provider,
      image: createUserDTO.image,
    });
  }
}
