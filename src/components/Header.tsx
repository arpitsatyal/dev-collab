import { AppShell, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React from "react";

const Header = () => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell.Header>
      <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
    </AppShell.Header>
  );
};

export default Header;
