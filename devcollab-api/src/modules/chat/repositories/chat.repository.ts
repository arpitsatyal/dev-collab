import { Injectable } from '@nestjs/common';
import { eq, desc, asc } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { chats, messages } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

@Injectable()
export class ChatRepository extends BaseRepository<typeof chats> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, chats);
  }

  findUnique(id: string) {
    return this.drizzle.db.query.chats.findFirst({
      where: eq(chats.id, id),
      with: { messages: { orderBy: asc(messages.createdAt) } },
    });
  }

  findManyBySender(senderId: string) {
    return this.drizzle.db.query.chats.findMany({
      where: eq(chats.senderId, senderId),
      orderBy: [desc(chats.updatedAt)],
      with: { messages: true },
    });
  }
}
