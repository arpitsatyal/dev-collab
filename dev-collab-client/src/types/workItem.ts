import type {
  WorkItem as DrizzleWorkItem,
  WorkItemInsert as DrizzleWorkItemInsert,
} from "../../../devcollab-api/src/common/drizzle/schema";
import { MakeCreateData } from "./common";
import { WorkspaceWithPin } from "./workspace";

export type WorkItem = DrizzleWorkItem;

export interface WorkItemCreateData extends MakeCreateData<DrizzleWorkItemInsert> {
  snippetIds?: string[];
}

export interface WorkItemWithWorkspace extends WorkItem {
  workspace?: WorkspaceWithPin;
}

export const WorkItemStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export type WorkItemStatus =
  (typeof WorkItemStatus)[keyof typeof WorkItemStatus];

export interface WorkItemSuggestion {
  title: string;
  description: string;
  suggestedStatus: WorkItemStatus;
  tags: string[];
  priority?: "HIGH" | "MEDIUM" | "LOW";
  category?: string;
}
