import { Injectable } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { messages } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

@Injectable()
export class MessageRepository extends BaseRepository<typeof messages> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, messages);
  }

  findUnique(id: string) {
    return this.drizzle.db.query.messages.findFirst({
      where: eq(messages.id, id),
    });
  }

  findByChatId(chatId: string, limit?: number) {
    const query = this.drizzle.db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    if (limit) {
      query.limit(limit);
    }

    return query;
  }
}
