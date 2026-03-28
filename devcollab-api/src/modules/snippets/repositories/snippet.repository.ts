import { Injectable } from '@nestjs/common';
import { eq, ilike, or, and } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { snippets } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

@Injectable()
export class SnippetRepository extends BaseRepository<typeof snippets> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, snippets);
  }

  findUnique(id: string) {
    return this.drizzle.db.query.snippets.findFirst({
      where: eq(snippets.id, id),
    });
  }

  findByWorkspaceId(workspaceId: string, limit?: number) {
    const query = this.drizzle.db
      .select()
      .from(snippets)
      .where(eq(snippets.workspaceId, workspaceId));
    if (limit) return query.limit(limit);
    return query;
  }

  findManyBySearch(workspaceId: string, search: string, limit = 3) {
    return this.drizzle.db
      .select()
      .from(snippets)
      .where(
        and(
          eq(snippets.workspaceId, workspaceId),
          or(
            ilike(snippets.title, `%${search}%`),
            ilike(snippets.content, `%${search}%`),
          ),
        ),
      )
      .limit(limit);
  }
}
