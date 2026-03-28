import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, ilike, or } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { workItems, workItemsToSnippets } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';
import { v4 as uuid } from 'uuid';

export type WorkItemStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

@Injectable()
export class WorkItemRepository extends BaseRepository<typeof workItems> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, workItems);
  }

  async findByWorkspaceId(workspaceId: string, limit?: number) {
    const query = this.drizzle.db.query.workItems.findMany({
      where: eq(workItems.workspaceId, workspaceId),
      with: {
        assignedTo: true,
        author: true,
      },
      limit,
    });
    return query;
  }

  async findById(id: string) {
    return this.drizzle.db.query.workItems.findFirst({
      where: eq(workItems.id, id),
      with: {
        assignedTo: true,
        author: true,
        snippets: {
          with: {
            snippet: true,
          },
        },
      },
    });
  }

  async findDueSoon(startDate: Date, endDate: Date) {
    return this.drizzle.db.query.workItems.findMany({
      where: and(gte(workItems.dueDate, startDate), lte(workItems.dueDate, endDate)),
      with: {
        assignedTo: true,
      },
    });
  }

  async findManyBySearch(workspaceId: string, query: string, limit = 3) {
    return this.drizzle.db.query.workItems.findMany({
      where: and(
        eq(workItems.workspaceId, workspaceId),
        or(
          ilike(workItems.title, `%${query}%`),
          ilike(workItems.description, `%${query}%`),
        ),
      ),
      limit,
    });
  }

  async create(data: {
    title: string;
    description?: string | null;
    status?: WorkItemStatus;
    assignedToId?: string | null;
    authorId?: string | null;
    workspaceId: string;
    dueDate?: Date | null;
    snippetIds?: string[];
  }) {
    const workItemId = uuid();
    const { snippetIds, ...rest } = data;

    return await this.drizzle.db.transaction(async (tx) => {
      const [workItem] = await tx
        .insert(workItems)
        .values({
          id: workItemId,
          ...rest,
          updatedAt: new Date(),
        } as any)
        .returning();

      if (snippetIds && snippetIds.length > 0) {
        await tx.insert(workItemsToSnippets).values(
          snippetIds.map((snippetId) => ({
            workItemId,
            snippetId,
          })),
        );
      }

      return workItem;
    });
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      status: WorkItemStatus;
      assignedToId: string | null;
      dueDate: Date | null;
      snippetIds: string[];
    }>,
  ) {
    const { snippetIds, ...rest } = data;

    return await this.drizzle.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(workItems)
        .set({ ...rest, updatedAt: new Date() } as any)
        .where(eq(workItems.id, id))
        .returning();

      if (snippetIds !== undefined) {
        await tx.delete(workItemsToSnippets).where(eq(workItemsToSnippets.workItemId, id));
        if (snippetIds.length > 0) {
          await tx.insert(workItemsToSnippets).values(
            snippetIds.map((snippetId) => ({
              workItemId: id,
              snippetId,
            })),
          );
        }
      }

      return updated;
    });
  }

  async delete(id: string) {
    return await this.drizzle.db.transaction(async (tx) => {
      await tx.delete(workItemsToSnippets).where(eq(workItemsToSnippets.workItemId, id));
      const [deleted] = await tx.delete(workItems).where(eq(workItems.id, id)).returning();
      return deleted;
    });
  }
}
