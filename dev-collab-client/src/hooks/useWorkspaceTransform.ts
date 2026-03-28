import { useCallback, useRef } from "react";
import { NavItemProps } from "../components/SideNav/SideNav";
import { IconFolder } from "@tabler/icons-react";
import { WorkspaceWithPin } from "../types";

// Utility to memoize workspace transformation
const useWorkspaceTransform = () => {
  const cache = useRef(new Map<string, NavItemProps>());

  return useCallback(
    (workspace: WorkspaceWithPin, loadedSnippets: Record<string, any>) => {
      const cacheKey = `${workspace.id}-${JSON.stringify(
        loadedSnippets[workspace.id] ?? []
      )}`;
      if (cache.current.has(cacheKey)) {
        return cache.current.get(cacheKey)!;
      }

      const transformed: NavItemProps = {
        id: workspace.id,
        label: workspace.title,
        path: `/workspaces/${workspace.id}`,
        icon: IconFolder,
        snippets: loadedSnippets[workspace.id] ?? [],
        workItems: [],
      };

      cache.current.set(cacheKey, transformed);
      return transformed;
    },
    []
  );
};
export default useWorkspaceTransform;
