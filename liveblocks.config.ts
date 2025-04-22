type UserInfo = {
  userId: string; // Added for others.info.userId
  name: string;
  avatar: string;
  email: string;
  color: string;
};

export type UserAwareness = {
  user?: UserInfo;
};

export type AwarenessList = [number, UserAwareness][];

declare global {
  interface Liveblocks {
    // User metadata for useSelf and useOthers
    UserMeta: {
      id: string; // userId from auth endpoint
      info: UserInfo;
    };
    // Presence data for cursors
    Presence: {
      cursor: { lineNumber: number; column: number } | null;
    };
  }
}

export {};
