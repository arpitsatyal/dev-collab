import { AppShell, NavLink } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import {
  IconGauge,
  IconActivity,
  IconPencil,
  IconLogout,
  IconDashboard,
} from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import axios from "axios";
import { Project } from "../interfaces/project";

const SideNav = () => {
  const router = useRouter();
  const [projectChildren, setProjectChildren] = useState([]);

  useEffect(() => {
    const getProjects = async () => {
      try {
        const { data } = await axios.get("/api/projects");
        const dynamicProjects = data.map((project: Project) => ({
          label: project.title,
          path: `/projects/${project.id}`,
          icon: IconDashboard,
          id: project.id,
        }));

        setProjectChildren(dynamicProjects);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };

    getProjects();
  }, []);

  const data = [
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
        ...projectChildren,
      ],
    },
    {
      icon: IconLogout,
      label: "Logout",
      handler: () => signOut(),
    },
  ];

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

    if (router.query.id) {
      return path.split("/")[2] === router.query.id;
    }
  };

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow my="md">
        {data.map((item) => (
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
                label={child.label}
                leftSection={<child.icon size={16} stroke={1.5} />}
                onClick={() => handleNavClick(child.path)}
              />
            ))}
          </NavLink>
        ))}
      </AppShell.Section>
    </AppShell.Navbar>
  );
};

export default SideNav;
