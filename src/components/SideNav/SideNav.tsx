import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell, Box, NavLink, Text } from "@mantine/core";
import {
  IconActivity,
  IconGauge,
  IconPencil,
  IconPlayCard,
  IconSubtask,
} from "@tabler/icons-react";
import { VariableSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import classes from "./SideNav.module.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useLazyGetSnippetsQuery } from "../../store/api/snippetApi";
import { useGetProjectsQuery } from "../../store/api/projectApi";
import { setSnippets } from "../../store/slices/snippetSlice";
import Loading from "../Loader/Loader";
import SnippetList from "../Snippets/SnippetList";
import { Project, Snippet, Task } from "@prisma/client";
import {
  incrementPage,
  setProjectsOpen,
} from "../../store/slices/projectSlice";
import useProjectTransform from "../../hooks/useProjectTransform";
import { uniqBy } from "lodash";
import SideNavFooter from "./SideNavFooter";

export interface NavItemProps {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path?: string;
  handler?: () => void;
  children?: (Project | NavItemProps)[];
  snippets?: Snippet[];
  tasks?: Task[];
}

const SideNav = () => {
  const router = useRouter();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const listRef = useRef<VariableSizeList>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const lastProjectIdRef = useRef<string | null>(null);

  const dispatch = useAppDispatch();
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );
  const { pageSize, skip, projectsOpen, isInsertingProject } = useAppSelector(
    (state) => state.project
  );
  const [triggerGetSnippets] = useLazyGetSnippetsQuery();

  const transformProject = useProjectTransform();
  const { data, isLoading, isFetching, isError } = useGetProjectsQuery(
    { skip, limit: pageSize },
    { skip: !projectsOpen }
  );
  const loadedProjects = useMemo(() => data?.items || [], [data?.items]);
  const hasMore = data?.hasMore || false;

  const currentProjectId = useMemo(() => {
    const id = router.query.projectId;
    if (!id || typeof id !== "string" || id === "create") return null;
    return id;
  }, [router.query.projectId]);

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
        id: "create-project",
        icon: IconPencil,
        label: "Create Project",
        path: "/projects/create",
      },
      {
        id: "projects",
        icon: IconActivity,
        label: "Projects",
        path: "/projects",
      },
    ],
    []
  );

  const navItemsWithProjects = useMemo(() => {
    const items = [...navItems];
    const projectsItem = items.find((item) => item.label === "Projects");
    if (projectsItem) {
      const uniqueProjects = uniqBy(loadedProjects, "id");
      projectsItem.children = uniqueProjects;
    }
    return items;
  }, [navItems, loadedProjects]);

  const projectNavItem = navItemsWithProjects.find(
    (item) => item.label === "Projects"
  );
  const projectItems = useMemo(
    () => projectNavItem?.children || [],
    [projectNavItem?.children]
  );

  const scrollItemIntoView = useCallback(
    (id: string) => {
      const index = projectItems.findIndex((item) => item.id === id);
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
    [projectItems]
  );

  const fetchSnippets = useCallback(
    async (projectId: string) => {
      if (!loadedSnippets[projectId]) {
        setLoadingProjectId(projectId);
        try {
          const result = await triggerGetSnippets({ projectId }).unwrap();
          dispatch(setSnippets({ projectId, snippets: result }));
        } catch (e) {
          console.error("Failed to load snippets", e);
        } finally {
          setLoadingProjectId(null);
        }
      }
    },
    [loadedSnippets, triggerGetSnippets, dispatch]
  );

  const handleScrollToItem = useCallback(
    (id: string) => {
      const isValidId = projectItems.some((item) => item.id === id);
      if (!isValidId || !listRef.current) return;

      setOpenItem(id);
      dispatch(setProjectsOpen(true));
      scrollItemIntoView(id);
    },
    [projectItems, listRef, setOpenItem, scrollItemIntoView, dispatch]
  );

  // Reset list heights
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [openItem, loadedSnippets]);

  useEffect(() => {
    if (!currentProjectId || !projectItems.length) return;
    if (!projectItems.some((item) => item.id === currentProjectId)) return;
    if (lastProjectIdRef.current === currentProjectId) return;

    const timeout = setTimeout(() => {
      handleScrollToItem(currentProjectId);
      lastProjectIdRef.current = currentProjectId;
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentProjectId, projectItems, handleScrollToItem, loadedSnippets]);

  useEffect(() => {
    if (!openItem || loadedSnippets[openItem]) return;
    fetchSnippets(openItem);
  }, [openItem, loadedSnippets, fetchSnippets]);

  const isItemLoaded = useCallback(
    (index: number) => {
      return index < projectItems.length;
    },
    [projectItems.length]
  );

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
      const item = projectItems[index];
      if (!item) return 40;

      const isLoading = loadingProjectId === item.id;
      if (isLoading) return 80;

      const isExpanded = openItem === item.id && loadedSnippets[item.id];
      if (isExpanded) {
        const snippetCount = loadedSnippets[item.id]?.length || 0;
        const baseHeight = 40;
        const taskHeight = 40;
        const createSnippetHeight = 40;
        const snippetHeight = 40;

        return (
          baseHeight +
          taskHeight +
          createSnippetHeight +
          snippetCount * snippetHeight
        );
      }

      return 40;
    },
    [openItem, loadedSnippets, projectItems, loadingProjectId]
  );

  const handleNavClick = useCallback(
    (path?: string, handler?: () => void, label?: string) => {
      if (handler) return handler();

      if (path) {
        if (label === "Projects") {
          dispatch(setProjectsOpen());
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
      if (item.label !== "Projects") return false;

      if (projectsOpen !== null) {
        return projectsOpen;
      }

      const projectsItem = navItemsWithProjects.find(
        (i) => i.label === "Projects"
      );
      if (!projectsItem?.children) return false;

      return projectsItem.children.some((child) => {
        const navItem =
          "path" in child
            ? child
            : transformProject(child as Project, loadedSnippets);
        return openItem === navItem.id || isActive(navItem.path);
      });
    },
    [
      projectsOpen,
      navItemsWithProjects,
      loadedSnippets,
      openItem,
      isActive,
      transformProject,
    ]
  );

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    // Show loading indicator row if index === projectItems.length (last row)
    const isLoadingRow = hasMore && index === projectItems.length;
    if (isLoadingRow) {
      return (
        <Box style={style} key={`loading-${index}`} ta="center" py="md">
          <Loading loaderHeight="5vh" />
        </Box>
      );
    }

    const project = projectItems[
      isInsertingProject ? index - 1 : index
    ] as Project;
    if (!project) return null;

    const child = transformProject(project, loadedSnippets);

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
            {loadingProjectId === child.id ? (
              <Loading loaderHeight="5vh" />
            ) : (
              <>
                <NavLink
                  label="Tasks"
                  active={isActive(`/projects/${child.id}/tasks`)}
                  leftSection={<IconSubtask size={16} />}
                  onClick={() => router.push(`/projects/${child.id}/tasks`)}
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
        {navItemsWithProjects.map((item) => (
          <NavLink
            key={item.id}
            active={isActive(item.path, item.id)}
            opened={isOpen(item)}
            label={item.label}
            leftSection={<item.icon size={16} stroke={1.5} />}
            onClick={() => handleNavClick(item.path, item.handler, item.label)}
          >
            {item.label === "Projects" && (
              <Box pr="xs">
                {isLoading ? (
                  <Loading />
                ) : isInsertingProject ? (
                  <Loading loaderHeight="20vh" />
                ) : (
                  <InfiniteLoader
                    isItemLoaded={isItemLoaded}
                    itemCount={
                      hasMore ? projectItems.length + 1 : projectItems.length
                    }
                    loadMoreItems={loadMoreItems}
                  >
                    {({ onItemsRendered, ref }) => (
                      <VariableSizeList
                        height={500}
                        width="100%"
                        itemCount={
                          hasMore
                            ? projectItems.length + 1
                            : projectItems.length
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
