import { useState, useCallback, useRef, useEffect } from "react";
import { BaseItems } from "../types";
import { IDBPDatabase } from "idb";
import { initDB } from "../lib/indexedDB";
import { useSession } from "next-auth/react";

const MAX_SEARCH_ORDER = 20;
const ORDER_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface RecentOrderEntry {
  userId: string;
  key: string; // type:id
  timestamp: number;
}

export const useRecentItems = (maxSearchOrder: number = MAX_SEARCH_ORDER) => {
  const [recentSearchOrder, setRecentSearchOrder] = useState<string[]>([]);
  const dbRef = useRef<IDBPDatabase | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

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

  const saveToDB = async (keys: string[]) => {
    if (!dbRef.current || !userId) return;

    try {
      const tx = dbRef.current.transaction("recentOrder", "readwrite");
      const store = tx.objectStore("recentOrder");
      const now = Date.now();

      for (const key of keys) {
        await store.put({ userId, key, timestamp: now });
      }

      const allEntries: RecentOrderEntry[] = await store.getAll();
      const userEntries = allEntries.filter((entry) => entry.userId === userId);

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
  };

  const addRecentItems = useCallback(
    (items: BaseItems[], maxItems: { searchOrder?: number } = {}) => {
      const effectiveMaxSearchOrder = maxItems.searchOrder ?? maxSearchOrder;

      setRecentSearchOrder((prevOrder) => {
        const newKeys = Array.from(
          new Set(
            items.map((item) => {
              const type = "type" in item ? item.type : "project";
              return `${type}:${item.id}`;
            })
          )
        );

        const allKeys = [...newKeys, ...prevOrder];
        const uniqueKeys = Array.from(new Set(allKeys));
        const orderedKeys = [
          ...newKeys,
          ...uniqueKeys.filter((key) => !newKeys.includes(key)),
        ].slice(0, effectiveMaxSearchOrder);

        saveToDB(orderedKeys);
        return orderedKeys;
      });
    },
    [maxSearchOrder, userId] // Depend on userId!
  );

  return { recentSearchOrder, addRecentItems };
};
