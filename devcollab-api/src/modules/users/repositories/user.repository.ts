import { Injectable } from '@nestjs/common';
import { eq, ilike, inArray } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { users } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

export type Provider = 'GOOGLE' | 'GITHUB' | 'LOCAL';

@Injectable()
export class UserRepository extends BaseRepository<typeof users> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, users);
  }

  async findByEmail(email: string) {
    return this.drizzle.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async searchByName(name: string) {
    return this.drizzle.db.query.users.findMany({
      where: ilike(users.name, `%${name}%`),
      limit: 10,
    });
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.drizzle.db.query.users.findMany({
      where: inArray(users.id, ids),
    });
  }
}
