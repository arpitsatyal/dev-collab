import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/router";
import { VariableSizeList } from "react-window";
import { NavLink, Text, Box, Group, Button, AppShell } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconGauge,
  IconPencil,
  IconActivity,
  IconFolder,
  IconSubtask,
  IconLogout,
  IconPlayCard,
} from "@tabler/icons-react";
import classes from "./SideNav.module.css";
import ThemeToggle from "../Theme/ThemeToggle";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useLazyGetSnippetsQuery } from "../../store/api/snippetApi";
import { setSnippets } from "../../store/slices/snippetSlice";
import { fetchProjects } from "../../store/thunks";
import { signOut } from "next-auth/react";
import Loading from "../Loader/Loader";
import SnippetList from "../Snippets/SnippetList";
import { RootState } from "../../store/store";
import { Snippet, Task } from "@prisma/client";

interface NavItemProps {
  id: string;
  label: string;
  path?: string;
  icon: React.ComponentType<{ size: number; stroke: number }>;
  handler?: () => void;
  children?: NavItemProps[];
  snippets?: Snippet[];
  tasks?: Task[];
}

const SideNav = () => {
  const router = useRouter();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const listRef = useRef<VariableSizeList>(null);
  const [projectsOpen, setProjectsOpen] = useState<boolean | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const lastProjectIdRef = useRef<string | null>(null);

  const dispatch = useAppDispatch();
  const { loadedProjects, isLoading } = useAppSelector(
    (state: RootState) => state.project
  );
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );
  const [triggerGetSnippets] = useLazyGetSnippetsQuery();

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
      setProjectsOpen(true);
      scrollItemIntoView(id);
    },
    [projectItems, listRef, setOpenItem, setProjectsOpen, scrollItemIntoView]
  );

  // Reset list heights
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true); // true = recompute heights
    }
  }, [openItem, loadedSnippets]);

  useEffect(() => {
    if (!currentProjectId || !projectItems.length) return;
    if (!projectItems.some((item) => item.id === currentProjectId)) return;
    if (lastProjectIdRef.current === currentProjectId) return;

    const timeout = setTimeout(() => {
      handleScrollToItem(currentProjectId);
      lastProjectIdRef.current = currentProjectId;
    }, 100); // gives time for layout/render/snippets to stabilize

    return () => clearTimeout(timeout);
  }, [currentProjectId, projectItems, handleScrollToItem, loadedSnippets]);

  useEffect(() => {
    if (!openItem || loadedSnippets[openItem]) return;
    fetchSnippets(openItem);
  }, [openItem, loadedSnippets, fetchSnippets]);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    signOut();
    router.push("/");
  }, [router]);

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
          setProjectsOpen((prev) => (prev === null ? true : !prev));
          setOpenItem(null);
        }
        router.push(path);
      }
    },
    [router]
  );

  const toggleOpenItem = (id: string) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

  const isActive = (path?: string, id?: string) => {
    if (!path) return false;

    if (id === "playground") {
      return router.asPath.startsWith("/playground");
    }

    return router.pathname === path || router.asPath === path;
  };
  const isOpen = (item: NavItemProps) => {
    return (
      item.label === "Projects" &&
      (projectsOpen !== null
        ? projectsOpen // if user manually toggled it
        : navItemsWithProjects // fallback to automatic logic
            .find((i) => i.label === "Projects")
            ?.children?.some(
              (child) => openItem === child.id || isActive(child.path)
            ))
    );
  };

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const child = projectItems[index];
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
                ) : (
                  <VariableSizeList
                    height={500}
                    width="100%"
                    itemCount={projectItems.length}
                    itemSize={getItemSize}
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
            style={{ fontWeight: 500, transition: "all 0.2s ease" }}
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
