import { AppShell, Box, Button, Group, NavLink, Text } from "@mantine/core";
import { useRouter } from "next/router";

import {
  IconActivity,
  IconPencil,
  IconLogout,
  IconFolder,
  IconSubtask,
  IconGauge,
} from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Loading from "../Loader";
import { useLazyGetSnippetsQuery } from "../../store/api/snippetApi";
import { setSnippets } from "../../store/slices/snippetSlice";
import { Project, Snippet, Task } from "@prisma/client";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchProjects } from "../../store/thunks";
import { RootState } from "../../store/store";
import { useMediaQuery } from "@mantine/hooks";
import SnippetList from "../Snippets/SnippetList";
import ThemeToggle from "../Theme/ThemeToggle";
import classes from "./SideNav.module.css";
import { VariableSizeList } from "react-window";

interface NavItemProps {
  id: string;
  icon: React.FC<any>;
  label: string;
  path?: string;
  handler?: () => void;
  children?: NavItemProps[];
  snippets?: Snippet[];
  tasks?: Task[];
}

const SideNav = () => {
  const router = useRouter();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const [projectsOpen, setProjectsOpen] = useState<boolean | null>(null);

  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const dispatch = useAppDispatch();

  const { loadedProjects, isLoading } = useAppSelector(
    (state: RootState) => state.project
  );

  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );

  const [triggerGetSnippets] = useLazyGetSnippetsQuery();

  const listRef = useRef<VariableSizeList>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true); // true = recompute heights
    }
  }, [openItem, loadedSnippets]);

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

  useEffect(() => {
    const currentProjectId = router.asPath.split("/")[2];
    if (!currentProjectId) return;

    setOpenItem(currentProjectId);
    setProjectsOpen(true);

    const timeout = setTimeout(() => {
      scrollItemIntoView(currentProjectId);
    }, 100);

    return () => clearTimeout(timeout);
  }, [router.asPath]);

  useEffect(() => {
    if (!openItem || loadedSnippets[openItem]) return;
    fetchSnippets(openItem);
  }, [openItem, loadedSnippets, fetchSnippets]);

  const handleLogout = useCallback(() => {
    signOut();
    router.push("/");
  }, [router]);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const navItems = useMemo<NavItemProps[]>(
    () => [
      {
        id: "home",
        icon: IconGauge,
        label: "Home",
        path: "/dashboard",
      },
      {
        id: "projects",
        icon: IconActivity,
        label: "Projects",
        path: "/projects",
        children: [
          {
            id: "create-project",
            icon: IconPencil,
            label: "Create Project",
            path: "/projects/create",
          },
        ],
      },
    ],
    []
  );

  const navItemsWithProjects = useMemo(() => {
    const items = [...navItems];
    const projectsItem = items.find((item) => item.label === "Projects");

    if (projectsItem) {
      const uniqueProjects = Array.from(
        new Map(
          [
            ...(projectsItem.children ?? []),
            ...loadedProjects.map((project) => ({
              id: project.id,
              label: project.title,
              path: `/projects/${project.id}`,
              icon: IconFolder,
              snippets: loadedSnippets[project.id] ?? [],
              tasks: [],
            })),
          ].map((item) => [item.path, item])
        ).values()
      );

      projectsItem.children = uniqueProjects;
    }

    return items;
  }, [navItems, loadedProjects, loadedSnippets]);

  const projectNavItem = navItemsWithProjects.find(
    (item) => item.label === "Projects"
  );
  const projectItems = useMemo(
    () => projectNavItem?.children || [],
    [projectNavItem?.children]
  );

  // Function to calculate item height dynamically
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

  const handleNavClick = (
    path?: string,
    handler?: () => void,
    label?: string
  ) => {
    if (handler) return handler();

    if (path) {
      if (label === "Projects") {
        setProjectsOpen((prev) => (prev === null ? true : !prev));
        setOpenItem("");
      }
      router.push(path);
    }
  };

  const toggleOpenItem = (id: string) => {
    setOpenItem((prev) => (prev === id ? null : id));
    if (listRef.current) {
      const index = projectItems.findIndex((item) => item.id === id);
      if (index !== -1) {
        listRef.current.resetAfterIndex(index);
      }
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;

    return router.pathname === path || router.asPath === path;
  };

  const isOpen = (item: NavItemProps) => {
    return (
      item.label === "Projects" &&
      (projectsOpen !== null
        ? projectsOpen // if user manually toggled it
        : // fallback to automatic logic
          navItemsWithProjects
            .find((i) => i.label === "Projects")
            ?.children?.some(
              (child) => openItem === child.id || isActive(child.path)
            ))
    );
  };

  const scrollItemIntoView = useCallback(
    (id: string) => {
      const index = projectItems.findIndex((item) => item.id === id);
      if (index === -1 || !listRef.current) return;

      const list = listRef.current as any; // to access internals
      const itemStyle = list._getItemStyle(index); // contains top
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

  const Row = ({
    index,
    style,
    data,
  }: {
    index: number;
    style: any;
    data: any;
  }) => {
    const child = data?.items[index];

    return (
      <Box style={style} key={child.id}>
        <NavLink
          key={child.label}
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
            scrollItemIntoView(child.id);
          }}
        >
          {child.label !== "Create Project" && (
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
          )}
        </NavLink>
      </Box>
    );
  };

  return (
    <>
      <AppShell.Section grow my="md" className={classes.section}>
        {navItemsWithProjects.map((item) => (
          <NavLink
            key={item.label}
            active={isActive(item.path)}
            opened={isOpen(item)}
            label={item.label}
            leftSection={<item.icon size={16} stroke={1.5} />}
            onClick={() => handleNavClick(item.path, item.handler, item.label)}
          >
            {item.label === "Projects" && (
              <Box pr="xs">
                {isLoading ? (
                  <Loading />
                ) : (
                  <VariableSizeList
                    height={500}
                    width="100%"
                    itemCount={projectItems.length}
                    itemSize={getItemSize}
                    itemData={{
                      items: projectItems,
                      isActive,
                      openItem,
                      loadedSnippets,
                      loadingProjectId,
                      toggleOpenItem,
                      handleNavClick,
                      scrollItemIntoView,
                      itemRefs,
                      router,
                    }}
                    ref={listRef}
                    className={classes.reactWindowList}
                  >
                    {Row}
                  </VariableSizeList>
                )}
              </Box>
            )}
          </NavLink>
        ))}
      </AppShell.Section>

      <Box className={classes.bottomDiv}>
        <Group justify="space-between" gap="sm">
          <Button
            variant="light"
            color="red"
            onClick={handleLogout}
            leftSection={<IconLogout size={18} />}
            radius="md"
            size="sm"
            style={{
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            Logout
          </Button>

          {isSmallScreen && <ThemeToggle />}
        </Group>
      </Box>
    </>
  );
};

export default SideNav;
