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

export const saveEntry = async <T>(
  storeName: string,
  item: T,
  db?: IDBPDatabase,
): Promise<void> => {
  const localDB = db || (await initDB());
  const tx = localDB.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  await store.put(item);
  await tx.done;
};

export const getAllEntries = async <T>(
  storeName: string,
  db?: IDBPDatabase,
): Promise<T[]> => {
  const localDB = db || (await initDB());
  const tx = localDB.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const entries = await store.getAll();
  await tx.done;
  return entries;
};

export const deleteEntry = async (
  storeName: string,
  key: any,
  db?: IDBPDatabase,
): Promise<void> => {
  const localDB = db || (await initDB());
  const tx = localDB.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  await store.delete(key);
  await tx.done;
};

export const trimStore = async (
  storeName: string,
  maxSize: number,
  db?: IDBPDatabase,
): Promise<void> => {
  const localDB = db || (await initDB());
  const tx = localDB.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const allEntries = await store.getAll();

  if (allEntries.length > maxSize) {
    // Assumes entries have a 'timestamp' property
    const sortedEntries = allEntries.sort(
      (a: any, b: any) => a.timestamp - b.timestamp,
    );
    const excessCount = allEntries.length - maxSize;
    const toDelete = sortedEntries.slice(0, excessCount);

    for (const entry of toDelete) {
      // Handle potential composite keys by checking if the store has a keyPath array
      const key = Array.isArray(store.keyPath)
        ? store.keyPath.map((kp: string) => entry[kp])
        : entry[store.keyPath as string];
      await store.delete(key);
    }
  }
  await tx.done;
};

export const deleteEntriesByFilter = async <T>(
  storeName: string,
  filterFn: (item: T) => boolean,
  db?: IDBPDatabase,
): Promise<void> => {
  const localDB = db || (await initDB());
  const tx = localDB.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const allEntries = await store.getAll();

  for (const entry of allEntries) {
    if (filterFn(entry)) {
      const key = Array.isArray(store.keyPath)
        ? store.keyPath.map((kp: string) => entry[kp])
        : entry[store.keyPath as string];
      await store.delete(key);
    }
  }
  await tx.done;
};

