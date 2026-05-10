import type {
  Doc as DrizzleDoc,
  DocInsert as DrizzleDocInsert,
} from "../../../devcollab-api/src/common/drizzle/schema";
import { MakeCreateData } from "./common";
import { WorkspaceWithPin } from "./workspace";

export type Doc = DrizzleDoc;
export type DocCreateData = MakeCreateData<DrizzleDocInsert>;

export type DocWithWorkspace = Doc & { workspace?: WorkspaceWithPin };
