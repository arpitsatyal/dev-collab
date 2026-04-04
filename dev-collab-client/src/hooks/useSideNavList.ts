import { useCallback, useRef, useState } from "react";
import { VariableSizeList } from "react-window";
import { WorkspaceWithPin } from "../types";
import type { NavItemProps } from "./useSideNavData";

export const useSideNavList = (
  workspaceItems: (WorkspaceWithPin | NavItemProps)[],
  openItem: string | null,
  loadedSnippets: Record<string, any>
) => {
  const listRef = useRef<VariableSizeList | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [loadingWorkspaceId, setLoadingWorkspaceId] = useState<string | null>(null);

  const getItemSize = useCallback(
    (index: number) => {
      const item = workspaceItems[index];
      if (!item) return 40;

      const isLoading = loadingWorkspaceId === (item as WorkspaceWithPin).id;
      if (isLoading) return 80;

      const isExpanded = openItem === (item as WorkspaceWithPin).id && loadedSnippets[(item as WorkspaceWithPin).id];
      if (isExpanded) {
        const pinIcon = 30;
        const snippetCount = loadedSnippets[(item as WorkspaceWithPin).id]?.length || 0;
        const baseHeight = 40;
        const workItemHeight = 40;
        const createSnippetHeight = 40;
        const snippetHeight = 40;
        const docsHeight = 40;

        return (
          pinIcon +
          baseHeight +
          workItemHeight +
          createSnippetHeight +
          docsHeight +
          snippetCount * snippetHeight
        );
      }

      return 40;
    },
    [openItem, loadedSnippets, workspaceItems, loadingWorkspaceId]
  );

  return { listRef, itemRefs, loadingWorkspaceId, setLoadingWorkspaceId, getItemSize };
};
