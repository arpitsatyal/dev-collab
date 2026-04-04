import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useLazyGetSnippetsQuery } from "../store/api/snippetApi";
import { useUpdatePinnedStatusMutation } from "../store/api/workspaceApi";
import { setSnippets } from "../store/slices/snippetSlice";
import { incrementPage, setWorkspacesOpen } from "../store/slices/workspaceSlice";
import useWorkspaceTransform from "./useWorkspaceTransform";
import { useSideNavData } from "./useSideNavData";
import type { NavItemProps } from "./useSideNavData";
import { useSideNavList } from "./useSideNavList";
import { useSideNavEffects } from "./useSideNavEffects";
import { WorkspaceWithPin } from "../types";

export type { NavItemProps };

export const useSideNav = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const transformWorkspace = useWorkspaceTransform();

  const [openItem, setOpenItem] = useState<string | null>(null);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const loadedSnippets = useAppSelector((state) => state.snippet.loadedSnippets);

  const [triggerGetSnippets] = useLazyGetSnippetsQuery();
  const [updatePinnedStatus] = useUpdatePinnedStatusMutation();

  const {
    navItemsWithWorkspaces,
    workspaceItems,
    isLoading,
    isFetching,
    isInsertingWorkspace,
    hasMore,
    workspacesOpen
  } = useSideNavData();

  const {
    listRef,
    itemRefs,
    loadingWorkspaceId,
    setLoadingWorkspaceId,
    getItemSize,
  } = useSideNavList(workspaceItems, openItem, loadedSnippets);

  const currentWorkspaceId = useMemo(() => {
    const id = router.query.workspaceId;
    if (!id || typeof id !== "string" || id === "create") return null;
    return id;
  }, [router.query.workspaceId]);

  const fetchSnippets = useCallback(
    async (workspaceId: string) => {
      if (!loadedSnippets[workspaceId]) {
        setLoadingWorkspaceId(workspaceId);
        try {
          const result = await triggerGetSnippets({ workspaceId }).unwrap();
          dispatch(setSnippets({ workspaceId, snippets: result }));
        } catch (e) {
          console.error("Failed to load snippets", e);
        } finally {
          setLoadingWorkspaceId(null);
        }
      }
    },
    [loadedSnippets, triggerGetSnippets, dispatch, setLoadingWorkspaceId]
  );

  useSideNavEffects({
    currentWorkspaceId,
    workspaceItems,
    listRef,
    openItem,
    setOpenItem,
    loadedSnippets,
    fetchSnippets,
    pendingScrollId,
    setPendingScrollId,
  });

  const loadMoreItems = useCallback(() => {
    if (hasMore && !isFetching) {
      dispatch(incrementPage());
    }
  }, [hasMore, isFetching, dispatch]);

  const handleNavClick = useCallback(
    (path?: string, handler?: () => void, label?: string) => {
      if (handler) return handler();

      if (path) {
        if (label === "Workspaces") {
          dispatch(setWorkspacesOpen());
          setOpenItem(null);
        }
        router.push(path);
      }
    },
    [router, dispatch]
  );

  const isActive = useCallback(
    (path?: string, id?: string): boolean => {
      if (!path) return false;

      if (id === "playground") {
        return router.asPath.startsWith("/playground");
      }

      return router.pathname === path || router.asPath === path;
    },
    [router]
  );

  const isOpen = useCallback(
    (item: NavItemProps) => {
      if (item.label !== "Workspaces") return false;

      if (workspacesOpen !== null) {
        return workspacesOpen;
      }

      const workspacesItem = navItemsWithWorkspaces.find((i) => i.label === "Workspaces");
      if (!workspacesItem?.children) return false;

      return workspacesItem.children.some((child) => {
        const navItem =
          "path" in child
            ? child
            : transformWorkspace(child as WorkspaceWithPin, loadedSnippets);
        return openItem === navItem.id || isActive(navItem.path);
      });
    },
    [workspacesOpen, navItemsWithWorkspaces, loadedSnippets, openItem, isActive, transformWorkspace]
  );

  const handleUpdatePinnedStatus = async (workspace: WorkspaceWithPin) => {
    try {
      setOpenItem((prev) => (prev === workspace.id ? null : workspace.id));

      await updatePinnedStatus({
        workspaceId: workspace.id,
        isPinned: !workspace.isPinned,
      }).unwrap();

      setPendingScrollId(workspace.id);

      notifications.show({
        title: "Job done!",
        message: `Workspace ${!workspace.isPinned ? "Pinned" : "Unpinned"} Successfully! 🌟`,
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update pinned status. Please try again.",
        color: "red",
      });
    }
  };

  return {
    navItemsWithWorkspaces,
    workspaceItems,
    isLoading,
    isFetching,
    isInsertingWorkspace,
    hasMore,
    openItem,
    loadingWorkspaceId,
    loadedSnippets,
    listRef,
    itemRefs,
    isActive,
    isOpen,
    setOpenItem,
    handleNavClick,
    handleUpdatePinnedStatus,
    loadMoreItems,
    getItemSize,
    transformWorkspace,
  };
};
