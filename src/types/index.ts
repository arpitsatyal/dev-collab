import type {
  Workspace as DrizzleWorkspace,
  WorkItem as DrizzleWorkItem,
  Snippet as DrizzleSnippet,
  Doc as DrizzleDoc,
  User as DrizzleUser,
  Chat as DrizzleChat,
  Message as DrizzleMessage,
} from '../../../devcollab-api/src/common/drizzle/schema';

export type Workspace = DrizzleWorkspace;
export type WorkItem = DrizzleWorkItem;

export type Snippet = DrizzleSnippet;
export type Doc = DrizzleDoc;
export type User = DrizzleUser;
export type Chat = DrizzleChat;
export type Message = DrizzleMessage;

export const WorkItemStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type WorkItemStatus = (typeof WorkItemStatus)[keyof typeof WorkItemStatus];

export class PrismaClient {
  user: any;
  workspace: any;
  workItem: any;
  snippet: any;
  doc: any;
  $disconnect: any;
  $transaction: any;
}
export const Prisma = {
  PrismaClientKnownRequestError: class extends Error {
    code: string;
    constructor(message: string) {
      super(message);
      this.code = 'P2002';
    }
  }
};

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
