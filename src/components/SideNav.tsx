import { AppShell, NavLink, ScrollArea } from "@mantine/core";
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
import { useMemo } from "react";
import SnippetList from "./SnippetList";

interface ProjectProps {
  label: string;
  icon: any;
  path: string;
  snippets?: Snippet[];
}

interface NavItemsProps {
  label: string;
  icon: any;
  path?: string;
  handler?: () => void;
  children?: ProjectProps[];
}

const SideNav = () => {
  const router = useRouter();
  const projects = useProjects();

  const navItems: NavItemsProps[] = [
    {
      icon: IconGauge,
      label: "Home",
      path: "/dashboard",
    },
    {
      icon: IconActivity,
      label: "Projects",
      path: "/projects",
      children: [
        {
          icon: IconPencil,
          label: "Create Project",
          path: "/projects/create",
        },
      ],
    },
    {
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

  const handleNavClick = (path?: string, handler?: () => void) => {
    if (handler) {
      handler();
    } else if (path) {
      router.push(path);
    }
  };

  // Determine if a nav item is active based on the current route
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

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow my="md">
        {enhancedNavItems.map((item) => (
          <NavLink
            key={item.label}
            active={isActive(item.path)}
            label={item.label}
            leftSection={<item.icon size={16} stroke={1.5} />}
            onClick={() => handleNavClick(item.path, item.handler)}
          >
            {item.children?.map((child) => (
              <NavLink
                key={child.label}
                active={isActive(child.path)}
                opened={isActive(child.path)}
                label={child.label}
                leftSection={<child.icon size={16} stroke={1.5} />}
                onClick={() => handleNavClick(child.path)}
              >
                {child.label !== "Create Project" && (
                  <SnippetList snippets={child.snippets ?? []} />
                )}
              </NavLink>
            ))}
          </NavLink>
        ))}
      </AppShell.Section>
    </AppShell.Navbar>
  );
};

export default SideNav;
