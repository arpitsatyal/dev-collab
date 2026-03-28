import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, count, inArray } from 'drizzle-orm';
import { UserRepository } from './repositories/user.repository';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { workspaces, snippets, docs, users, workItems } from 'src/common/drizzle/schema';
import { InferInsertModel } from 'drizzle-orm';

type CreateUserDTO = Omit<InferInsertModel<typeof users>, 'id' | 'createdAt' | 'emailVerified'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly drizzle: DrizzleService,
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

  async searchByName(text: string): Promise<string[]> {
    const decodedText = decodeURIComponent(text).trim().toLowerCase();
    const allUsers = await this.userRepo.findMany();
    return allUsers
      .filter((user) => user.name && user.name.toLowerCase().includes(decodedText))
      .map((user) => user.id);
  }

  async getStatsByEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    // Get all workspace IDs owned by this user
    const userWorkspaces = await this.drizzle.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.ownerId, user.id));

    const workspaceIds = userWorkspaces.map((w) => w.id);

    const [workspacesCount, snippetsCount, docsCount, workItemsCount] = await Promise.all([
      // Count owned workspaces
      this.drizzle.db
        .select({ value: count() })
        .from(workspaces)
        .where(eq(workspaces.ownerId, user.id))
        .then((r) => r[0].value),

      // Count snippets authored
      this.drizzle.db
        .select({ value: count() })
        .from(snippets)
        .where(eq(snippets.authorId, user.id))
        .then((r) => r[0].value),

      // Count docs in user's workspaces
      workspaceIds.length > 0
        ? this.drizzle.db
            .select({ value: count() })
            .from(docs)
            .where(inArray(docs.workspaceId, workspaceIds))
            .then((r) => r[0].value)
        : Promise.resolve(0),

      // Count workItems in user's workspaces
      workspaceIds.length > 0
        ? this.drizzle.db
            .select({ value: count() })
            .from(workItems)
            .where(inArray(workItems.workspaceId, workspaceIds))
            .then((r) => r[0].value)
        : Promise.resolve(0),
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
