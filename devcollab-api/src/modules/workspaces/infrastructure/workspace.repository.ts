import { Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { workspaces, userPinnedWorkspaces } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';
import { v4 as uuid } from 'uuid';

@Injectable()
export class WorkspaceRepository extends BaseRepository<typeof workspaces> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, workspaces);
  }

  findPaginated(skip = 0, take = 20) {
    return this.drizzle.db.query.workspaces.findMany({
      offset: skip,
      limit: take,
    });
  }

  findManyRaw(userId: string, skip = 0, take = 20) {
    return this.drizzle.db.execute(
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
    const existing = await this.drizzle.db.query.userPinnedWorkspaces.findFirst({
      where: and(
        eq(userPinnedWorkspaces.userId, userId),
        eq(userPinnedWorkspaces.workspaceId, workspaceId),
      ),
    });
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
}
