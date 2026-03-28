import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, AppShell, Box, NavLink, Text } from "@mantine/core";
import {
  IconPin,
  IconPlayCard,
  IconSubtask,
  IconCloudDownload,
  IconGauge,
  IconPencil,
  IconActivity,
  IconBrandPagekit,
} from "@tabler/icons-react";
import { VariableSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import classes from "./SideNav.module.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useLazyGetSnippetsQuery } from "../../store/api/snippetApi";
import {
  useGetWorkspacesQuery,
  useUpdatePinnedStatusMutation,
} from "../../store/api/workspaceApi";
import { setSnippets } from "../../store/slices/snippetSlice";
import Loading from "../Loader/Loader";
import SnippetList from "../Snippets/SnippetList";
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
  const listRef = useRef<VariableSizeList>(null);
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
  const { data, isLoading, isFetching, isError } = useGetWorkspacesQuery(
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
  }, [currentWorkspaceId, workspaceItems, handleScrollToItem, loadedSnippets]);

  useEffect(() => {
    if (!openItem || loadedSnippets[openItem]) return;
    fetchSnippets(openItem);
  }, [openItem, loadedSnippets, fetchSnippets]);

  const isItemLoaded = useCallback(
    (index: number) => {
      return index < workspaceItems.length;
    },
    [workspaceItems.length]
  );

  useEffect(() => {
    if (!pendingScrollId) return;

    toggleOpenItem(pendingScrollId);
    scrollItemIntoView(pendingScrollId);
    setPendingScrollId(null);
  }, [pendingScrollId, workspaceItems, scrollItemIntoView]);

  const loadMoreItems = useCallback(
    (startIndex: number, stopIndex: number) => {
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

      const isLoading = loadingWorkspaceId === item.id;
      if (isLoading) return 80;

      const isExpanded = openItem === item.id && loadedSnippets[item.id];
      if (isExpanded) {
        const pinIcon = 30;
        const snippetCount = loadedSnippets[item.id]?.length || 0;
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

  const toggleOpenItem = (id: string) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

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
      toggleOpenItem(workspace.id);

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

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    // Show loading indicator row if index === workspaceItems.length (last row)
    const isLoadingRow = hasMore && index === workspaceItems.length;
    if (isLoadingRow) {
      return (
        <Box style={style} key={`loading-${index}`} ta="center">
          <Loading loaderHeight="5vh" />
        </Box>
      );
    }

    const workspace = workspaceItems[
      isInsertingWorkspace ? index - 1 : index
    ] as WorkspaceWithPin;
    if (!workspace) return null;

    const child = transformWorkspace(workspace, loadedSnippets);

    return (
      <Box style={style} key={child.id}>
        <NavLink
          key={child.id}
          active={isActive(child.path)}
          opened={openItem === child.id}
          label={
            <Text
              fz="sm"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {child.label}
            </Text>
          }
          ref={(el) => {
            itemRefs.current[child.id] = el;
          }}
          leftSection={<child.icon size={16} stroke={1.5} />}
          onClick={() => {
            toggleOpenItem(child.id);
            handleNavClick(child.path);
          }}
        >
          <Box>
            {loadingWorkspaceId === child.id ? (
              <Loading loaderHeight="5vh" />
            ) : (
              <>
                <ActionIcon
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdatePinnedStatus(workspace);
                  }}
                  style={(theme) => ({
                    color: workspace.isPinned
                      ? theme.colors.yellow[5]
                      : theme.colors.gray[5],
                    "&:hover": {
                      color: theme.colors.yellow[7],
                    },
                    padding: 5,
                  })}
                >
                  <IconPin size={16} />
                </ActionIcon>

                <NavLink
                  label="Work Items"
                  active={isActive(`/workspaces/${child.id}/work-items`)}
                  leftSection={<IconSubtask size={16} />}
                  onClick={() => router.push(`/workspaces/${child.id}/work-items`)}
                />
                <NavLink
                  label="Docs"
                  active={router.pathname.includes("docs")}
                  leftSection={<IconBrandPagekit size={16} />}
                  onClick={() => router.push(`/workspaces/${child.id}/docs`)}
                />
                <SnippetList
                  snippets={loadedSnippets[child.id] ?? []}
                  isVisible={
                    openItem === child.id && !!loadedSnippets[child.id]
                  }
                />
              </>
            )}
          </Box>
        </NavLink>
      </Box>
    );
  };

  return (
    <>
      <AppShell.Section grow my="md" className={classes.section}>
        {navItemsWithWorkspaces.map((item) => (
          <NavLink
            key={item.id}
            active={isActive(item.path, item.id)}
            opened={isOpen(item)}
            label={item.label}
            leftSection={<item.icon size={16} stroke={1.5} />}
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
                  <InfiniteLoader
                    isItemLoaded={isItemLoaded}
                    itemCount={
                      hasMore ? workspaceItems.length + 1 : workspaceItems.length
                    }
                    loadMoreItems={loadMoreItems}
                  >
                    {({ onItemsRendered, ref }) => (
                      <VariableSizeList
                        height={500}
                        width="100%"
                        itemCount={
                          hasMore
                            ? workspaceItems.length + 1
                            : workspaceItems.length
                        }
                        itemSize={getItemSize}
                        onItemsRendered={onItemsRendered}
                        ref={(list) => {
                          listRef.current = list || null;
                          ref(list);
                        }}
                        className={classes.reactWindowList}
                      >
                        {Row}
                      </VariableSizeList>
                    )}
                  </InfiniteLoader>
                )}
              </Box>
            )}
          </NavLink>
        ))}
      </AppShell.Section>

      <SideNavFooter />
    </>
  );
};

export default SideNav;
