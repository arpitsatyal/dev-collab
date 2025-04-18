declare global {
  interface Liveblocks {
    // User metadata for useSelf and useOthers
    UserMeta: {
      id: string; // userId from auth endpoint
      info: {
        userId: string; // Added for others.info.userId
        name: string;
        avatar: string;
        email: string;
      };
    };
    // Presence data for cursors
    Presence: {
      cursor: { lineNumber: number; column: number } | null;
    };
  }
}

export {};
