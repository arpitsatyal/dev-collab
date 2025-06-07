import { useState, useCallback } from "react";
import { BaseItems } from "../types";

export const useRecentItems = (maxSearchOrder: number = 10) => {
  const [recentSearchOrder, setRecentSearchOrder] = useState<string[]>([]);

  const addRecentItems = useCallback(
    (items: BaseItems[], maxItems: { searchOrder?: number } = {}) => {
      const effectiveMaxSearchOrder = maxItems.searchOrder ?? maxSearchOrder;

      setRecentSearchOrder((prevOrder) => {
        // Create type:id keys for all items
        const newKeys = Array.from(
          new Set(
            items.map((item) => {
              const type = "type" in item ? item.type : "project"; //fallback to project
              return `${type}:${item.id}`;
            })
          )
        );
        const filteredOrder = prevOrder.filter((key) => !newKeys.includes(key));
        return [...newKeys, ...filteredOrder].slice(0, effectiveMaxSearchOrder);
      });
    },
    [maxSearchOrder]
  );

  return { recentSearchOrder, addRecentItems };
};
