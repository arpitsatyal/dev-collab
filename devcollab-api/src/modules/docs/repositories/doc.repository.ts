import { Injectable } from '@nestjs/common';
import { eq, ilike, and } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { docs } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

@Injectable()
export class DocRepository extends BaseRepository<typeof docs> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, docs);
  }

  findUnique(id: string) {
    return this.drizzle.db.query.docs.findFirst({
      where: eq(docs.id, id),
    });
  }

  findByRoomId(roomId: string) {
    return this.drizzle.db.query.docs.findFirst({
      where: eq(docs.roomId, roomId),
    });
  }

  findByWorkspaceId(workspaceId: string, limit?: number) {
    const query = this.drizzle.db
      .select()
      .from(docs)
      .where(eq(docs.workspaceId, workspaceId));
    if (limit) return query.limit(limit);
    return query;
  }

  findManyByLabel(workspaceId: string, search: string, limit = 3) {
    return this.drizzle.db
      .select()
      .from(docs)
      .where(and(eq(docs.workspaceId, workspaceId), ilike(docs.label, `%${search}%`)))
      .limit(limit);
  }

  async updateByRoomId(roomId: string, data: Partial<{ content: unknown; updatedAt: Date }>) {
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
}
