import { useState, useCallback, useRef, useEffect } from "react";
import { BaseItems } from "../types";
import { IDBPDatabase } from "idb";
import { initDB } from "../lib/browser/indexedDB";
import { uniq } from "lodash";

const MAX_SEARCH_ORDER = 20;
const ORDER_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface RecentOrderEntry {
  userId: string;
  key: string; // type:id
  timestamp: number;
}

export const useRecentItems = (
  userId: string | undefined,
  maxSearchOrder: number = MAX_SEARCH_ORDER
) => {
  const [recentSearchOrder, setRecentSearchOrder] = useState<string[]>([]);
  const dbRef = useRef<IDBPDatabase | null>(null);

  useEffect(() => {
    if (!userId) {
      setRecentSearchOrder([]);
      return;
    }

    const init = async () => {
      try {
        const db = await initDB();
        dbRef.current = db;

        const tx = db.transaction("recentOrder", "readonly");
        const store = tx.objectStore("recentOrder");
        const now = Date.now();
        const allEntries: RecentOrderEntry[] = await store.getAll();

        const userEntries = allEntries.filter(
          (entry) => entry.userId === userId
        );
        const validEntries = userEntries.filter(
          (entry) => now - entry.timestamp < ORDER_EXPIRY_MS
        );

        setRecentSearchOrder(validEntries.map((entry) => entry.key));

        // Clean up expired entries
        if (allEntries.length !== validEntries.length) {
          const txClean = db.transaction("recentOrder", "readwrite");
          const storeClean = txClean.objectStore("recentOrder");
          for (const entry of allEntries) {
            if (now - entry.timestamp >= ORDER_EXPIRY_MS) {
              await storeClean.delete(entry.key);
            }
          }
          await txClean.done;
        }
      } catch (error) {
        console.error("Failed to initialize IndexedDB for recentOrder:", error);
      }
    };

    init();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
    };
  }, [userId]);

  const saveToDB = useCallback(
    async (keys: string[]) => {
      if (!dbRef.current || !userId) return;

      try {
        const tx = dbRef.current.transaction("recentOrder", "readwrite");
        const store = tx.objectStore("recentOrder");
        const now = Date.now();

        for (const key of keys) {
          await store.put({ userId, key, timestamp: now });
        }

        const allEntries: RecentOrderEntry[] = await store.getAll();
        const userEntries = allEntries.filter(
          (entry) => entry.userId === userId
        );

        if (userEntries.length > maxSearchOrder) {
          const sortedEntries = userEntries.sort(
            (a, b) => a.timestamp - b.timestamp
          );
          const excess = sortedEntries.slice(
            0,
            allEntries.length - maxSearchOrder
          );
          for (const entry of excess) {
            await store.delete([entry.userId, entry.key]);
          }
        }

        await tx.done;
      } catch (error) {
        console.error("Failed to save to recentOrder:", error);
      }
    },
    [dbRef, userId, maxSearchOrder]
  );

  const addRecentItems = useCallback(
    (items: BaseItems[], maxItems: { searchOrder?: number } = {}) => {
      const effectiveMaxSearchOrder = maxItems.searchOrder ?? maxSearchOrder;

      setRecentSearchOrder((prevOrder) => {
        const newKeys = items.map((item) => {
          const type = "type" in item ? item.type : "project";
          return `${type}:${item.id}`;
        });

        const allKeys = [...newKeys, ...prevOrder];
        const uniqueKeys = uniq(allKeys);

        const orderedKeys = uniqueKeys.slice(0, effectiveMaxSearchOrder);

        saveToDB(orderedKeys);
        return orderedKeys;
      });
    },
    [maxSearchOrder, saveToDB]
  );

  const clearRecentItems = useCallback(async () => {
    if (!userId) return;

    let db: IDBPDatabase | null = null;

    try {
      db = await initDB();
      const tx = db.transaction("recentOrder", "readwrite");
      const store = tx.objectStore("recentOrder");
      const allEntries: RecentOrderEntry[] = await store.getAll();

      // Delete only entries for the current user
      for (const entry of allEntries) {
        if (entry.userId === userId) {
          await store.delete([entry.userId, entry.key]);
        }
      }

      await tx.done;
      setRecentSearchOrder([]);
    } catch (error) {
      console.error("Failed to clear recent searches:", error);
    } finally {
      if (db) {
        db.close();
      }
    }
  }, [userId]);
  return { recentSearchOrder, addRecentItems, clearRecentItems };
};
