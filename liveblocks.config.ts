type UserInfo = {
  name: string;
  avatar: string;
  email: string;
};

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
