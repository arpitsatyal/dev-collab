import { WorkspaceWithPin } from "./workspace";
import { WorkItemWithWorkspace } from "./workItem";
import { SnippetWithWorkspace } from "./snippet";
import { DocWithWorkspace } from "./doc";
import { ChatWithMessages, Message } from "./chat";

/**
 * Unified Discriminated Union (AppItem)
 * This is the core engine for searchable and categorized items across the application.
 */

export type AppItemType = "workspace" | "workItem" | "snippet" | "doc" | "chat" | "message";

export type TypedItem<K extends AppItemType = AppItemType> = {
  workspace: WorkspaceWithPin & { type: "workspace" };
  workItem: WorkItemWithWorkspace & { type: "workItem" };
  snippet: SnippetWithWorkspace & { type: "snippet" };
  doc: DocWithWorkspace & { type: "doc" };
  chat: ChatWithMessages & { type: "chat" };
  message: Message & { type: "message" };
}[K];

export type TypedItems = TypedItem<
  "workspace" | "workItem" | "snippet" | "doc" | "chat"
>;

export type CacheDataSource = TypedItems;
