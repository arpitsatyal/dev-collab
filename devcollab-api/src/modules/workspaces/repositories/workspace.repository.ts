import { Injectable } from '@nestjs/common';
import { eq, and, sql, count, or, ilike } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { workspaces, userPinnedWorkspaces } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';
import { v4 as uuid } from 'uuid';

@Injectable()
export class WorkspaceRepository extends BaseRepository<typeof workspaces> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, workspaces);
  }

  async findPaginated(skip = 0, take = 20) {
    return await this.drizzle.db.query.workspaces.findMany({
      offset: skip,
      limit: take,
    });
  }

  async findManyBySearch(query: string, limit = 3) {
    return await this.drizzle.db.query.workspaces.findMany({
      where: or(
        ilike(workspaces.title, `%${query}%`),
        ilike(workspaces.description, `%${query}%`),
      ),
      limit,
    });
  }

  async findManyRaw(userId: string, skip = 0, take = 20) {
    return await this.drizzle.db.execute(
      sql`
        SELECT w.*,
              (uww."userId" IS NOT NULL) AS "isPinned"
        FROM "Workspace" w
        LEFT JOIN "UserPinnedWorkspace" uww
          ON uww."userId" = ${userId}
          AND uww."workspaceId" = w."id"
        ORDER BY "isPinned" DESC, w."createdAt" DESC
        OFFSET ${skip}
        LIMIT ${take}
      `,
    );
  }

  async upsertPin(userId: string, workspaceId: string) {
    // Check if pin exists
    const existing = await this.drizzle.db.query.userPinnedWorkspaces.findFirst(
      {
        where: and(
          eq(userPinnedWorkspaces.userId, userId),
          eq(userPinnedWorkspaces.workspaceId, workspaceId),
        ),
      },
    );
    if (!existing) {
      await this.drizzle.db
        .insert(userPinnedWorkspaces)
        .values({ id: uuid(), userId, workspaceId });
    }
  }

  async deletePin(userId: string, workspaceId: string) {
    await this.drizzle.db
      .delete(userPinnedWorkspaces)
      .where(
        and(
          eq(userPinnedWorkspaces.userId, userId),
          eq(userPinnedWorkspaces.workspaceId, workspaceId),
        ),
      );
  }

  async countByOwnerId(ownerId: string) {
    const res = await this.drizzle.db
      .select({ value: count() })
      .from(workspaces)
      .where(eq(workspaces.ownerId, ownerId));
    return res[0].value;
  }

  async findIdsByOwnerId(ownerId: string) {
    const res = await this.drizzle.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.ownerId, ownerId));
    return res.map((r) => r.id);
  }

  async findByIdWithContext(id: string, limit = 5) {
    return await this.drizzle.db.query.workspaces.findFirst({
      where: eq(workspaces.id, id),
      with: {
        snippets: { limit },
        docs: { limit },
        workItems: { limit },
      },
    });
  }
}
