import type {
  Chat as DrizzleChat,
  Message as DrizzleMessage,
} from "../../../devcollab-api/src/common/drizzle/schema";

export type Chat = DrizzleChat;
export type Message = DrizzleMessage;

export type ChatWithMessages = Chat & { messages?: Message[] };
