import type {
  Workspace as DrizzleWorkspace,
  WorkspaceInsert as DrizzleWorkspaceInsert,
} from "../../../devcollab-api/src/common/drizzle/schema";
import { MakeCreateData } from "./common";

export type Workspace = DrizzleWorkspace;
export type WorkspaceCreateData = MakeCreateData<DrizzleWorkspaceInsert>;
export type WorkspaceWithPin = Workspace & { isPinned: boolean };
