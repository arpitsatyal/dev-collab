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

// 1. Central Model Definitions (Mapping Drizzle entities to app keys)
export type Models = {
  workspace: DrizzleWorkspace;
  workItem: DrizzleWorkItem;
  snippet: DrizzleSnippet;
  doc: DrizzleDoc;
  chat: DrizzleChat;
  message: DrizzleMessage;
  user: DrizzleUser;
};

// 2. Specialized Entity Types (pinned, with relation wrappers)
export type WorkspaceWithPin = DrizzleWorkspace & { isPinned: boolean };
export type SnippetWithWorkspace = DrizzleSnippet & { workspace?: WorkspaceWithPin };
export type WorkItemWithWorkspace = DrizzleWorkItem & { workspace?: WorkspaceWithPin };
export type DocWithWorkspace = DrizzleDoc & { workspace?: WorkspaceWithPin };
export type ChatWithMessages = DrizzleChat & { messages?: DrizzleMessage[] };

// 3. Unified Discriminated Union (AppItem)
// This is the core engine for searchable and categorized items.
export type AppItemType = keyof Omit<Models, 'user'>;

export type TypedItem<K extends AppItemType = AppItemType> = {
  workspace: WorkspaceWithPin & { type: "workspace" };
  workItem: WorkItemWithWorkspace & { type: "workItem" };
  snippet: SnippetWithWorkspace & { type: "snippet" };
  doc: DocWithWorkspace & { type: "doc" };
  chat: ChatWithMessages & { type: "chat" };
  message: DrizzleMessage & { type: "message" };
}[K];

// 4. Unified Interface Exports (Backward Compatibility & Simplification)
export type TypedItems = TypedItem<'workspace' | 'workItem' | 'snippet' | 'doc' | 'chat'>;
export type BaseItems = Models['workspace' | 'workItem' | 'snippet' | 'doc' | 'chat'];
export type CacheDataSource = TypedItems;

export interface Workspace extends DrizzleWorkspace {}
export interface WorkspaceCreateData extends MakeCreateData<DrizzleWorkspaceInsert> {}
export interface WorkItem extends DrizzleWorkItem {}
export interface WorkItemCreateData extends MakeCreateData<DrizzleWorkItemInsert> { snippetIds?: string[] }
export interface Snippet extends DrizzleSnippet {}
export interface SnippetsCreateData extends MakeCreateData<DrizzleSnippetInsert> {}
export interface SnippetsUpdateData extends Partial<SnippetsCreateData> {}

export interface Doc extends DrizzleDoc {}
export interface DocCreateData extends MakeCreateData<DrizzleDocInsert> {}
export interface User extends DrizzleUser {}

export interface Chat extends DrizzleChat {}
export interface Message extends DrizzleMessage {}

export const WorkItemStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type WorkItemStatus = (typeof WorkItemStatus)[keyof typeof WorkItemStatus];

export type SaveStatus = "saving" | "saved" | "error" | "idle" | undefined;

export interface WorkItemSuggestion {
  title: string;
  description: string;
  suggestedStatus: WorkItemStatus;
  tags: string[];
  priority?: "HIGH" | "MEDIUM" | "LOW";
  category?: string;
}


