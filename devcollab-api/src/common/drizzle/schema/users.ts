import { pgTable, text, timestamp, varchar, json, index } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { providerEnum } from './enums';

export const users = pgTable('User', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  image: text('image'),
  provider: providerEnum('provider').notNull(),
  emailVerified: timestamp('emailVerified'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

export const sessions = pgTable(
  'session',
  {
    sid: varchar('sid').primaryKey().notNull(),
    sess: json('sess').notNull(),
    expire: timestamp('expire', { precision: 6, mode: 'date' }).notNull(),
  },
  (table) => {
    return {
      expireIdx: index('IDX_session_expire').on(table.expire),
    };
  },
);
