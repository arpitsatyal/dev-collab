import type {
  Workspace as DrizzleWorkspace,
  WorkspaceInsert as DrizzleWorkspaceInsert,
  WorkItem as DrizzleWorkItem,
  WorkItemInsert as DrizzleWorkItemInsert,
  Snippet as DrizzleSnippet,
  SnippetInsert as DrizzleSnippetInsert,
  Doc as DrizzleDoc,
  DocInsert as DrizzleDocInsert,
  User as DrizzleUser,
  Chat as DrizzleChat,
  Message as DrizzleMessage,
} from '../../../devcollab-api/src/common/drizzle/schema';

type OptionalFields = 'id' | 'createdAt' | 'updatedAt';
type MakeCreateData<T> = Omit<T, OptionalFields> & Partial<Pick<T, Extract<keyof T, OptionalFields>>>;

export type Workspace = DrizzleWorkspace;
export type WorkspaceCreateData = MakeCreateData<DrizzleWorkspaceInsert>;
export type WorkItem = DrizzleWorkItem;
export type WorkItemCreateData = MakeCreateData<DrizzleWorkItemInsert> & { snippetIds?: string[] };
export type Snippet = DrizzleSnippet;
export type SnippetsCreateData = MakeCreateData<DrizzleSnippetInsert>;
export type SnippetsUpdateData = Partial<SnippetsCreateData>;

export type Doc = DrizzleDoc;
export type DocCreateData = MakeCreateData<DrizzleDocInsert>;
export type User = DrizzleUser;

export type Chat = DrizzleChat;
export type Message = DrizzleMessage;

export const WorkItemStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type WorkItemStatus = (typeof WorkItemStatus)[keyof typeof WorkItemStatus];


export type WorkspaceWithPin = Workspace & { isPinned: boolean };

type WithType<T, K extends ItemType> = T & { type: K };
type SnippetWithWorkspace = Snippet & { workspace?: WorkspaceWithPin };
type WorkItemWithWorkspace = WorkItem & { workspace?: WorkspaceWithPin };

export type SaveStatus = "saving" | "saved" | "error" | "idle" | undefined;
export type ItemType = "workspace" | "workItem" | "snippet";

type WorkspaceWithType = WithType<WorkspaceWithPin, "workspace">;
type SnippetWithType = WithType<Snippet, "snippet">;
type WorkItemWithType = WithType<WorkItem, "workItem">;

export type TypedItems = WorkspaceWithType | SnippetWithType | WorkItemWithType;
export type BaseItems = WorkspaceWithPin | Snippet | WorkItem;
export type MeiliSearchPayload =
  | WorkspaceWithPin
  | SnippetWithWorkspace
  | WorkItemWithWorkspace;

export type CacheDataSource =
  | WithType<WorkspaceWithPin, "workspace">
  | WithType<SnippetWithWorkspace, "snippet">
  | WithType<WorkItemWithWorkspace, "workItem">;

export type ChatWithMessages = Chat & { messages?: Message[] };

export interface WorkItemSuggestion {
  title: string;
  description: string;
  suggestedStatus: WorkItemStatus;
  tags: string[];
  priority?: "HIGH" | "MEDIUM" | "LOW";
  category?: string;
}


