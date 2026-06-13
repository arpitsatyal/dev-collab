import type {
  Snippet as DrizzleSnippet,
  SnippetInsert as DrizzleSnippetInsert,
} from "../../../devcollab-api/src/common/drizzle/schema";
import { MakeCreateData } from "./common";
import { WorkspaceWithPin } from "./workspace";

export type Snippet = DrizzleSnippet;
export type SnippetsCreateData = MakeCreateData<DrizzleSnippetInsert>;
export type SnippetsUpdateData = Partial<SnippetsCreateData>;

export type SnippetWithWorkspace = Snippet & {
  workspace?: WorkspaceWithPin;
};
