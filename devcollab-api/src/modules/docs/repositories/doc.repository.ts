import { Injectable } from '@nestjs/common';
import { eq, ilike, and, count, inArray, or } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { docs } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

@Injectable()
export class DocRepository extends BaseRepository<typeof docs> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, docs);
  }

  async findUnique(id: string) {
    return await this.drizzle.db.query.docs.findFirst({
      where: eq(docs.id, id),
    });
  }

  async findByRoomId(roomId: string) {
    return await this.drizzle.db.query.docs.findFirst({
      where: eq(docs.roomId, roomId),
    });
  }

  async findByWorkspaceId(workspaceId: string, limit?: number) {
    return await this.drizzle.db.query.docs.findMany({
      where: eq(docs.workspaceId, workspaceId),
      limit,
    });
  }

  async findManyBySearch(workspaceId: string, search: string, limit = 3) {
    return await this.drizzle.db.query.docs.findMany({
      where: and(
        eq(docs.workspaceId, workspaceId),
        ilike(docs.label, `%${search}%`),
      ),
      limit,
      with: { workspace: true },
    });
  }

  async updateByRoomId(
    roomId: string,
    data: Partial<{ content: unknown; updatedAt: Date }>,
  ) {
    const updateData = { ...data };
    if ('updatedAt' in this.table) {
      (updateData as any).updatedAt = new Date();
    }
    const [row] = await this.drizzle.db
      .update(docs)
      .set(updateData as any)
      .where(eq(docs.roomId, roomId))
      .returning();
    return row;
  }

  async countByWorkspaceIds(workspaceIds: string[]) {
    if (workspaceIds.length === 0) return 0;
    const res = await this.drizzle.db
      .select({ value: count() })
      .from(docs)
      .where(inArray(docs.workspaceId, workspaceIds));
    return res[0].value;
  }
}
