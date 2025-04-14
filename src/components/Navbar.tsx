import { AppShell, NavLink } from "@mantine/core";
import React, { useState } from "react";
import { IconActivity, IconGauge, IconLogout } from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";

const Navbar = () => {
  const [active, setActive] = useState(0);
  const router = useRouter();

  const handleNavClick = (index: number, handler: Function) => {
    setActive(index);
    handler();
  };

  const handleDashboard = () => {
    router.push("/");
  };

  const handleProjects = () => {
    router.push("/projects");
  };

  const handleLogout = () => {
    signOut();
  };

  const data = [
    {
      icon: IconGauge,
      label: "Home",
      handler: handleDashboard,
    },
    {
      icon: IconActivity,
      label: "Projects",
      handler: handleProjects,
    },
    { icon: IconLogout, label: "Logout", handler: handleLogout },
  ];

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow my="md">
        {data.map((item, index) => (
          <NavLink
            key={item.label}
            active={index === active}
            label={item.label}
            leftSection={<item.icon size={16} stroke={1.5} />}
            onClick={() => handleNavClick(index, item.handler)}
          />
        ))}
      </AppShell.Section>
    </AppShell.Navbar>
  );
};

export default Navbar;
