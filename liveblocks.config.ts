type UserInfo = {
  name: string;
  color: string;
  avatar: string;
  email: string;
};

export type UserAwareness = {
  user?: UserInfo;
};

export type AwarenessList = [number, UserAwareness][];

declare global {
  interface Liveblocks {
    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string; // Accessible through `user.id`
      info: UserInfo; // Accessible through `user.info`
    };
    Presence: {
      cursor: { lineNumber: number; column: number } | null;
    };
  }
}
