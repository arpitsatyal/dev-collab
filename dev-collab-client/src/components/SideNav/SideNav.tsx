import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell, Box, Text } from "@mantine/core";
import {
  IconPlayCard,
  IconCloudDownload,
  IconGauge,
  IconPencil,
  IconActivity,
} from "@tabler/icons-react";
import { VariableSizeList } from "react-window";
import classes from "./SideNav.module.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useLazyGetSnippetsQuery } from "../../store/api/snippetApi";
import {
  useGetWorkspacesQuery,
  useUpdatePinnedStatusMutation,
} from "../../store/api/workspaceApi";
import { setSnippets } from "../../store/slices/snippetSlice";
import Loading from "../Loader/Loader";
import { Snippet, WorkItem } from "../../types";
import {
  incrementPage,
  setWorkspacesOpen,
} from "../../store/slices/workspaceSlice";
import useWorkspaceTransform from "../../hooks/useWorkspaceTransform";
import { uniqBy } from "lodash";
import SideNavFooter from "./SideNavFooter";
import { notifications } from "@mantine/notifications";
import { WorkspaceWithPin } from "../../types";
import NavItem from "./NavItem";
import WorkspacesList from "./WorkspacesList";

export interface NavItemProps {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path?: string;
  handler?: () => void;
  children?: (WorkspaceWithPin | NavItemProps)[];
  snippets?: Snippet[];
  workItems?: WorkItem[];
}

const SideNav = () => {
  const router = useRouter();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const listRef = useRef<VariableSizeList | null>(null);
  const [loadingWorkspaceId, setLoadingWorkspaceId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const lastWorkspaceIdRef = useRef<string | null>(null);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );
  const { pageSize, skip, workspacesOpen, isInsertingWorkspace } = useAppSelector(
    (state) => state.workspace
  );
  const [triggerGetSnippets] = useLazyGetSnippetsQuery();
  const [updatePinnedStatus] = useUpdatePinnedStatusMutation();

  const transformWorkspace = useWorkspaceTransform();
  const { data, isLoading, isFetching } = useGetWorkspacesQuery(
    { skip, limit: pageSize },
    { skip: !workspacesOpen }
  );
  const loadedWorkspaces = useMemo(() => data?.items || [], [data?.items]);
  const hasMore = data?.hasMore || false;

  const currentWorkspaceId = useMemo(() => {
    const id = router.query.workspaceId;
    if (!id || typeof id !== "string" || id === "create") return null;
    return id;
  }, [router.query.workspaceId]);

  const navItems = useMemo<NavItemProps[]>(
    () => [
      { id: "home", icon: IconGauge, label: "Home", path: "/dashboard" },
      {
        id: "playground",
        icon: IconPlayCard,
        label: "Playground",
        path: "/new",
      },
      {
        id: "create-workspace",
        icon: IconPencil,
        label: "Create Workspace",
        path: "/workspaces/create",
      },
      {
        id: "import-workspace",
        icon: IconCloudDownload,
        label: "Import from GitHub",
        path: "/workspaces/import",
      },
      {
        id: "workspaces",
        icon: IconActivity,
        label: "Workspaces",
        path: "/workspaces",
      },
    ],
    []
  );

  const navItemsWithWorkspaces = useMemo(() => {
    const items = [...navItems];
    const workspacesItem = items.find((item) => item.label === "Workspaces");
    if (workspacesItem) {
      const uniqueWorkspaces = uniqBy(loadedWorkspaces, "id");
      workspacesItem.children = uniqueWorkspaces;
    }
    return items;
  }, [navItems, loadedWorkspaces]);

  const workspaceNavItem = navItemsWithWorkspaces.find(
    (item) => item.label === "Workspaces"
  );
  const workspaceItems = useMemo(
    () => workspaceNavItem?.children || [],
    [workspaceNavItem?.children]
  );

  const scrollItemIntoView = useCallback(
    (id: string) => {
      const index = workspaceItems.findIndex((item) => item.id === id);
      if (index === -1 || !listRef.current) return;

      const list = listRef.current as any;
      const itemStyle = list._getItemStyle(index);
      const itemOffsetTop = itemStyle.top;
      const itemHeight = itemStyle.height;

      const outerRef = list._outerRef as HTMLElement;
      const listHeight = outerRef.clientHeight;

      const itemCenter = itemOffsetTop + itemHeight / 2;
      const scrollTarget = itemCenter - listHeight / 2;

      outerRef.scrollTo({
        top: scrollTarget,
        behavior: "smooth",
      });
    },
    [workspaceItems]
  );

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
    [loadedSnippets, triggerGetSnippets, dispatch]
  );

  const handleScrollToItem = useCallback(
    (id: string) => {
      const isValidId = workspaceItems.some((item) => item.id === id);
      if (!isValidId || !listRef.current) return;

      setOpenItem(id);
      dispatch(setWorkspacesOpen(true));
      scrollItemIntoView(id);
    },
    [workspaceItems, listRef, setOpenItem, scrollItemIntoView, dispatch]
  );

  // Reset list heights
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [openItem, loadedSnippets]);

  useEffect(() => {
    if (!currentWorkspaceId || !workspaceItems.length) return;
    if (!workspaceItems.some((item) => item.id === currentWorkspaceId)) return;
    if (lastWorkspaceIdRef.current === currentWorkspaceId) return;

    const timeout = setTimeout(() => {
      handleScrollToItem(currentWorkspaceId);
      lastWorkspaceIdRef.current = currentWorkspaceId;
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentWorkspaceId, workspaceItems, handleScrollToItem]);

  useEffect(() => {
    if (!openItem || loadedSnippets[openItem]) return;
    fetchSnippets(openItem);
  }, [openItem, loadedSnippets, fetchSnippets]);

  useEffect(() => {
    if (!pendingScrollId) return;

    setOpenItem((prev) => (prev === pendingScrollId ? null : pendingScrollId));
    scrollItemIntoView(pendingScrollId);
    setPendingScrollId(null);
  }, [pendingScrollId, workspaceItems, scrollItemIntoView]);

  const loadMoreItems = useCallback(
    () => {
      if (hasMore && !isFetching) {
        dispatch(incrementPage());
      }
    },
    [hasMore, isFetching, dispatch]
  );

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

      const workspacesItem = navItemsWithWorkspaces.find(
        (i) => i.label === "Workspaces"
      );
      if (!workspacesItem?.children) return false;

      return workspacesItem.children.some((child) => {
        const navItem =
          "path" in child
            ? child
            : transformWorkspace(child as WorkspaceWithPin, loadedSnippets);
        return openItem === navItem.id || isActive(navItem.path);
      });
    },
    [
      workspacesOpen,
      navItemsWithWorkspaces,
      loadedSnippets,
      openItem,
      isActive,
      transformWorkspace,
    ]
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
        message: `Workspace ${!workspace.isPinned ? "Pinned" : "Unpinned"
          } Successfully! 🌟`,
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update pinned status. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <>
      <AppShell.Section grow my="md" className={classes.section}>
        {navItemsWithWorkspaces.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={isActive(item.path, item.id)}
            opened={isOpen(item)}
            onClick={() => handleNavClick(item.path, item.handler, item.label)}
          >
            {item.label === "Workspaces" && (
              <Box pr="xs">
                {isLoading ? (
                  <Loading />
                ) : isInsertingWorkspace ? (
                  <Loading loaderHeight="20vh" />
                ) : workspaceItems.length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center" py="sm" fs="italic">
                    No workspaces added yet
                  </Text>
                ) : (
                  <WorkspacesList
                    workspaceItems={workspaceItems as WorkspaceWithPin[]}
                    hasMore={hasMore}
                    isFetching={isFetching}
                    isInsertingWorkspace={isInsertingWorkspace}
                    openItem={openItem}
                    loadingWorkspaceId={loadingWorkspaceId}
                    loadedSnippets={loadedSnippets}
                    isActive={isActive}
                    onToggleItem={(id) => setOpenItem((prev) => (prev === id ? null : id))}
                    onUpdatePinnedStatus={handleUpdatePinnedStatus}
                    onLoadMore={loadMoreItems}
                    getItemSize={getItemSize}
                    transformWorkspace={transformWorkspace}
                    listRef={listRef}
                    itemRefs={itemRefs}
                  />
                )}
              </Box>
            )}
          </NavItem>
        ))}
      </AppShell.Section>

      <SideNavFooter />
    </>
  );
};

export default SideNav;
