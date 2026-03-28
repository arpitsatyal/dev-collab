import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { users } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

export type Provider = 'GOOGLE' | 'GITHUB' | 'LOCAL';

@Injectable()
export class UserRepository extends BaseRepository<typeof users> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, users);
  }

  findByEmail(email: string) {
    return this.drizzle.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }
}
