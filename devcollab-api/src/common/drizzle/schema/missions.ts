import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { missionStatusEnum, missionStepStatusEnum } from './enums';

export const missions = pgTable('Mission', {
  id: text('id').primaryKey(),
  goal: text('goal').notNull(),
  status: missionStatusEnum('status').default('PENDING').notNull(),
  workspaceId: text('workspaceId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export type Mission = InferSelectModel<typeof missions>;
export type MissionInsert = InferInsertModel<typeof missions>;

export const missionSteps = pgTable('MissionStep', {
  id: text('id').primaryKey(),
  missionId: text('missionId').notNull(),
  label: text('label').notNull(),
  status: missionStepStatusEnum('status').default('PENDING').notNull(),
  payload: json('payload'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type MissionStep = InferSelectModel<typeof missionSteps>;
export type MissionStepInsert = InferInsertModel<typeof missionSteps>;

export const missionLogs = pgTable('MissionLog', {
  id: text('id').primaryKey(),
  missionId: text('missionId').notNull(),
  stepId: text('stepId'),
  type: text('type').notNull().default('log'),
  message: text('message').notNull(),
  payload: json('payload'),
  sequence: timestamp('sequence').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type MissionLogModel = InferSelectModel<typeof missionLogs>;
export type MissionLogInsert = InferInsertModel<typeof missionLogs>;
