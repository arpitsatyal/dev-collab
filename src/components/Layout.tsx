import { AppShell, Box, Burger, Flex } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import SideNav from "./SideNav";
import ProjectSearch from "./ProjectSearch";

export default function Layout({ children }: any) {
  const [opened, { toggle }] = useDisclosure();
  const isSmallScreen = useMediaQuery("(max-width: 600px)");

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Flex
          align="center"
          justify={!isSmallScreen ? "flex-end" : "space-between"}
          p={15}
          style={{
            width: "100%",
          }}
        >
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />

          <Box>
            <ProjectSearch />
          </Box>
        </Flex>
      </AppShell.Header>
      <SideNav />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
