import { useState, useCallback, useEffect } from "react";
import { TypedItems } from "../types";
import {
  saveEntry,
  getAllEntries,
  deleteEntriesByFilter,
  trimStore,
} from "../lib/browser/indexedDB";
import { uniq } from "lodash";

const MAX_SEARCH_ORDER = 20;

interface RecentOrderEntry {
  userId: string;
  key: string; // type:id
  timestamp: number;
}

export const useRecentItems = (
  userId: string | undefined,
  maxSearchOrder: number = MAX_SEARCH_ORDER,
) => {
  const [recentSearchOrder, setRecentSearchOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setRecentSearchOrder([]);
      return;
    }

    const init = async () => {
      try {
        const allEntries: RecentOrderEntry[] = await getAllEntries("recentOrder");
        const now = Date.now();
        const ORDER_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

        const userEntries = allEntries.filter(
          (entry) => entry.userId === userId,
        );
        const validEntries = userEntries.filter(
          (entry) => now - entry.timestamp < ORDER_EXPIRY_MS,
        );

        setRecentSearchOrder(validEntries.map((entry) => entry.key));

        await trimStore("recentOrder", maxSearchOrder);
      } catch (error) {
        console.error("Failed to initialize IndexedDB for recentOrder:", error);
      }
    };

    init();
  }, [userId, maxSearchOrder]);

  const saveToDB = useCallback(
    async (keys: string[]) => {
      if (!userId) return;

      try {
        const now = Date.now();

        for (const key of keys) {
          await saveEntry("recentOrder", { userId, key, timestamp: now });
        }

        await trimStore("recentOrder", maxSearchOrder);
      } catch (error) {
        console.error("Failed to save to recentOrder:", error);
      }
    },
    [userId, maxSearchOrder],
  );

  const addRecentItems = useCallback(
    (items: TypedItems[], maxItems: { searchOrder?: number } = {}) => {
      const effectiveMaxSearchOrder = maxItems.searchOrder ?? maxSearchOrder;

      setRecentSearchOrder((prevOrder) => {
        const newKeys = items.map((item) => `${item.type}:${item.id}`);

        const allKeys = [...newKeys, ...prevOrder];
        const uniqueKeys = uniq(allKeys);

        const orderedKeys = uniqueKeys.slice(0, effectiveMaxSearchOrder);

        saveToDB(orderedKeys);
        return orderedKeys;
      });
    },
    [maxSearchOrder, saveToDB],
  );

  const clearRecentItems = useCallback(async () => {
    if (!userId) return;

    try {
      await deleteEntriesByFilter<RecentOrderEntry>(
        "recentOrder",
        (entry) => entry.userId === userId,
      );
      setRecentSearchOrder([]);
    } catch (error) {
      console.error("Failed to clear recent searches:", error);
    }
  }, [userId]);
  return { recentSearchOrder, addRecentItems, clearRecentItems };
};
