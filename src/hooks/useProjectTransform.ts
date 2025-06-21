import { useCallback, useRef } from "react";
import { NavItemProps } from "../components/SideNav/SideNav";
import { Project } from "@prisma/client";
import { IconFolder, IconPin } from "@tabler/icons-react";

// Utility to memoize project transformation
const useProjectTransform = () => {
  const cache = useRef(new Map<string, NavItemProps>());

  return useCallback(
    (project: Project, loadedSnippets: Record<string, any>) => {
      const cacheKey = `${project.id}-${JSON.stringify(
        loadedSnippets[project.id] ?? []
      )}`;
      if (cache.current.has(cacheKey)) {
        return cache.current.get(cacheKey)!;
      }

      const transformed: NavItemProps = {
        id: project.id,
        label: project.title,
        path: `/projects/${project.id}`,
        icon: IconFolder,
        snippets: loadedSnippets[project.id] ?? [],
        tasks: [],
      };

      cache.current.set(cacheKey, transformed);
      return transformed;
    },
    []
  );
};
export default useProjectTransform;
