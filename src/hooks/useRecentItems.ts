import { Project, Snippet, Task } from "@prisma/client";
import { useState, useCallback } from "react";

export const useRecentItems = (
  maxProjects: number = 5,
  maxSearchOrder: number = 20
) => {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentSearchOrder, setRecentSearchOrder] = useState<string[]>([]);

  const addRecentItems = useCallback(
    (
      items: (Project | Snippet | Task)[],
      maxItems: { projects?: number; searchOrder?: number } = {}
    ) => {
      const effectiveMaxProjects = maxItems.projects ?? maxProjects;
      const effectiveMaxSearchOrder = maxItems.searchOrder ?? maxSearchOrder;

      setRecentProjects((prevProjects) => {
        // Filter projects from items
        const newProjects = items.filter((item): item is Project =>
          "type" in item ? item.type === "project" : true
        );
        if (newProjects.length === 0) return prevProjects; // No projects to add

        const newProjectIds = new Set(newProjects.map((p) => p.id));
        const filteredProjects = prevProjects.filter(
          (p) => !newProjectIds.has(p.id)
        );
        return [...newProjects, ...filteredProjects].slice(
          0,
          effectiveMaxProjects
        );
      });

      setRecentSearchOrder((prevOrder) => {
        // Create type:id keys for all items
        const newKeys = items.map((item) => {
          const type = "type" in item ? item.type : "project"; // Default to project if type not specified
          return `${type}:${item.id}`;
        });
        const filteredOrder = prevOrder.filter((key) => !newKeys.includes(key));
        return [...newKeys, ...filteredOrder].slice(0, effectiveMaxSearchOrder);
      });
    },
    [maxProjects, maxSearchOrder]
  );

  return { recentProjects, recentSearchOrder, addRecentItems };
};
