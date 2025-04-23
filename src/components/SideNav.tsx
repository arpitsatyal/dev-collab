import { AppShell, Box, NavLink, ScrollArea, Stack } from "@mantine/core";
import { useRouter } from "next/router";

import {
  IconGauge,
  IconActivity,
  IconPencil,
  IconLogout,
  IconFolder,
} from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import { Project, Snippet } from "../interfaces";
import { useProjects } from "../hooks/projects";
import { useEffect, useMemo, useState } from "react";
import SnippetList from "./SnippetList";
import Loading from "./Loader";

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
  const { projects, loading } = useProjects();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [projectsOpen, setProjectsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const pathParts = router.asPath.split("/");

    if (pathParts[1] === "projects" && pathParts[2]) {
      const projectId = pathParts[2];
      setOpenItems(new Set([projectId]));
    }
  }, [router.asPath]);

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
              snippets: project.snippets,
            })),
          ].map((item) => [item.path, item])
        ).values()
      );

      projectsItem.children = uniqueProjects;
    }

    return items;
  }, [navItems, projects]);

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

  const toggleOpenItem = (projectId: string) => {
    setOpenItems((prev) => {
      const newSet = new Set<string>();
      if (!prev.has(projectId)) {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    const pathName = router.pathname;

    if (path === pathName) {
      return true;
    }

    if (router.query.projectId) {
      return path.split("/")[2] === router.query.projectId;
    }
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

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow my="md">
        {loading ? (
          <Loading />
        ) : (
          <>
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
                <ScrollArea.Autosize
                  offsetScrollbars
                  scrollbarSize={4}
                  type="auto"
                  mah={500}
                >
                  <Box pr="xs">
                    {item.children?.map((child) => (
                      <NavLink
                        key={child.label}
                        active={isActive(child.path)}
                        opened={openItems.has(child.id)}
                        label={child.label}
                        leftSection={<child.icon size={16} stroke={1.5} />}
                        onClick={() => {
                          toggleOpenItem(child.id);
                          handleNavClick(child.path);
                        }}
                      >
                        {child.label !== "Create Project" && (
                          <SnippetList snippets={child.snippets ?? []} />
                        )}
                      </NavLink>
                    ))}
                  </Box>
                </ScrollArea.Autosize>
              </NavLink>
            ))}
          </>
        )}
      </AppShell.Section>
    </AppShell.Navbar>
  );
};

export default SideNav;
