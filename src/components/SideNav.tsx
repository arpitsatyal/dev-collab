import { AppShell, Box, NavLink, ScrollArea } from "@mantine/core";
import { useRouter } from "next/router";

import {
  IconGauge,
  IconActivity,
  IconPencil,
  IconLogout,
  IconFolder,
} from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import SnippetList from "./SnippetList";
import Loading from "./Loader";
import { useGetProjectsQuery } from "../store/api/projectApi";
import { useLazyGetSnippetsQuery } from "../store/api/snippetApi";
import { setSnippets } from "../store/slices/snippetSlice";
import { Project, Snippet } from "@prisma/client";
import { useAppDispatch, useAppSelector } from "../store/hooks";

interface NavItemProps {
  id: string;
  icon: React.FC<any>;
  label: string;
  path?: string;
  handler?: () => void;
  children?: NavItemProps[];
  snippets?: Snippet[];
}

const SideNav = () => {
  const router = useRouter();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [projectsOpen, setProjectsOpen] = useState<boolean | null>(null);

  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const { data: projects = [], isLoading } = useGetProjectsQuery();
  const pathParts = router.asPath.split("/");
  const projectId = pathParts[2];

  const dispatch = useAppDispatch();
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );

  const [triggerGetSnippets] = useLazyGetSnippetsQuery();

  const fetchSnippets = async (projectId: string) => {
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
  };

  useEffect(() => {
    if (pathParts[1] === "projects" && pathParts[2]) {
      setOpenItems(new Set([projectId]));
      setProjectsOpen(true);
      scrollItemIntoView(projectId);
      fetchSnippets(projectId);
    }
  }, [router.asPath, projectId]);

  const navItems: NavItemProps[] = [
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
    {
      id: "logout",
      icon: IconLogout,
      label: "Logout",
      handler: () => signOut(),
    },
  ];

  const enhancedNavItems = useMemo(() => {
    const items = [...navItems];
    const projectsItem = items.find((item) => item.label === "Projects");

    if (projectsItem) {
      const uniqueProjects = Array.from(
        new Map(
          [
            ...(projectsItem.children ?? []),
            ...projects.map((project: Project) => ({
              id: project.id,
              label: project.title,
              path: `/projects/${project.id}`,
              icon: IconFolder,
              snippets: loadedSnippets[project.id] ?? [],
            })),
          ].map((item) => [item.path, item])
        ).values()
      );

      projectsItem.children = uniqueProjects;
    }

    return items;
  }, [navItems, projects, loadedSnippets]);

  const handleNavClick = (
    path?: string,
    handler?: () => void,
    label?: string
  ) => {
    if (handler) return handler();

    if (path) {
      if (label === "Projects") {
        setProjectsOpen((prev) => (prev === null ? true : !prev));
        setOpenItems(new Set());
      }
      router.push(path);
    }
  };

  const toggleOpenItem = async (projectId: string) => {
    setOpenItems((prev) => {
      const newSet = new Set<string>();
      if (!prev.has(projectId)) {
        newSet.add(projectId);
      }
      return newSet;
    });

    await fetchSnippets(projectId);
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
          enhancedNavItems
            .find((i) => i.label === "Projects")
            ?.children?.some(
              (child) => openItems.has(child.id) || isActive(child.path)
            ))
    );
  };

  const scrollItemIntoView = (id: string) => {
    const el = itemRefs.current[id];
    const viewport = viewportRef.current;

    if (!el || !viewport) return;

    const elTop = el.offsetTop;
    const elHeight = el.offsetHeight;
    const elCenter = elTop + elHeight / 2;

    const viewportHeight = viewport.clientHeight;
    const scrollTarget = elCenter - viewportHeight / 2;

    viewport.scrollTo({ top: scrollTarget, behavior: "smooth" });
  };

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow my="md">
        {enhancedNavItems.map((item) => (
          <NavLink
            key={item.label}
            active={isActive(item.path)}
            opened={isOpen(item)}
            label={item.label}
            leftSection={<item.icon size={16} stroke={1.5} />}
            onClick={() => {
              handleNavClick(item.path, item.handler, item.label);
            }}
          >
            {item.label === "Projects" && (
              <ScrollArea.Autosize
                offsetScrollbars
                scrollbarSize={4}
                type={isLoading ? "never" : "auto"}
                mah={500}
                viewportRef={viewportRef}
              >
                <Box pr="xs" key={item.id}>
                  {item.children?.map((child) => (
                    <>
                      {isLoading ? (
                        <Loading />
                      ) : (
                        <NavLink
                          key={child.label}
                          active={isActive(child.path)}
                          opened={openItems.has(child.id)}
                          label={child.label}
                          ref={(el: HTMLAnchorElement | null) => {
                            itemRefs.current[child.id] = el;
                          }}
                          leftSection={<child.icon size={16} stroke={1.5} />}
                          onClick={() => {
                            toggleOpenItem(child.id);
                            handleNavClick(child.path);
                            scrollItemIntoView(child.id);
                          }}
                        >
                          {child.label !== "Create Project" &&
                            (loadingProjectId === child.id ? (
                              <Loading loaderHeight="5vh" />
                            ) : (
                              <SnippetList
                                snippets={loadedSnippets[child.id] ?? []}
                                isVisible={
                                  openItems.has(child.id) &&
                                  !!loadedSnippets[child.id]
                                }
                              />
                            ))}
                        </NavLink>
                      )}
                    </>
                  ))}
                </Box>
              </ScrollArea.Autosize>
            )}
          </NavLink>
        ))}
      </AppShell.Section>
    </AppShell.Navbar>
  );
};

export default SideNav;
