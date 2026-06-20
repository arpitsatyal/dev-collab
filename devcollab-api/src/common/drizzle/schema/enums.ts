import { pgEnum } from 'drizzle-orm/pg-core';

export const providerEnum = pgEnum('Provider', ['GOOGLE', 'GITHUB', 'LOCAL']);

export const workItemStatusValues = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const workItemStatusEnum = pgEnum(
  'WorkItemStatus',
  workItemStatusValues,
);
export type WorkItemStatus = (typeof workItemStatusValues)[number];

export const missionStatusValues = [
  'PENDING',
  'RUNNING',
  'PAUSED',
  'WAITING_FOR_USER',
  'COMPLETED',
  'FAILED',
] as const;
export const missionStatusEnum = pgEnum('MissionStatus', missionStatusValues);
export type MissionStatus = (typeof missionStatusValues)[number];

export const missionStepStatusValues = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
] as const;
export const missionStepStatusEnum = pgEnum(
  'MissionStepStatus',
  missionStepStatusValues,
);
export type MissionStepStatus = (typeof missionStepStatusValues)[number];
