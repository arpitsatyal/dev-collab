import { useCallback, useRef } from "react";
import { NavItemProps } from "../components/SideNav/SideNav";
import { IconFolder } from "@tabler/icons-react";
import { ProjectWithPin } from "../types";

// Utility to memoize project transformation
const useProjectTransform = () => {
  const cache = useRef(new Map<string, NavItemProps>());

  return useCallback(
    (project: ProjectWithPin, loadedSnippets: Record<string, any>) => {
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
