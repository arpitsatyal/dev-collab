import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "devcollabDB";
const DB_VERSION = 3;

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("searchCache")) {
        db.createObjectStore("searchCache", { keyPath: "query" });
      }
      if (!db.objectStoreNames.contains("recentOrder")) {
        db.createObjectStore("recentOrder", { keyPath: ["userId", "key"] });
      }
    },
  });
};
