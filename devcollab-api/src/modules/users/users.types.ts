import { users } from 'src/common/drizzle/schema';
import { InferInsertModel } from 'drizzle-orm';

export type CreateUserDTO = Omit<
  InferInsertModel<typeof users>,
  'id' | 'createdAt' | 'emailVerified'
>;
