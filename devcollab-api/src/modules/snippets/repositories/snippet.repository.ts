import { Injectable } from '@nestjs/common';
import { count, eq, ilike, or, and } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { snippets } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

@Injectable()
export class SnippetRepository extends BaseRepository<typeof snippets> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, snippets);
  }

  async findUnique(id: string) {
    return await this.drizzle.db.query.snippets.findFirst({
      where: eq(snippets.id, id),
      with: { workspace: true },
    });
  }

  async findByWorkspaceId(workspaceId: string, limit?: number) {
    return await this.drizzle.db.query.snippets.findMany({
      where: eq(snippets.workspaceId, workspaceId),
      limit,
    });
  }

  async findManyBySearch(workspaceId: string, search: string, limit = 3) {
    return await this.drizzle.db.query.snippets.findMany({
      where: and(
        eq(snippets.workspaceId, workspaceId),
        or(
          ilike(snippets.title, `%${search}%`),
          ilike(snippets.content, `%${search}%`),
        ),
      ),
      with: { workspace: true },
      limit,
    });
  }

  async countByAuthorId(authorId: string) {
    const res = await this.drizzle.db
      .select({ value: count() })
      .from(snippets)
      .where(eq(snippets.authorId, authorId));
    return res[0].value;
  }
}
