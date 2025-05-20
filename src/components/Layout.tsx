import { AppShell, Box, Burger, Flex } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import SideNav from "./SideNav";
import SpotlightSearch from "./SpotlightSearch";

export default function Layout({ children }: any) {
  const [opened, { toggle }] = useDisclosure();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

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
          justify={isSmallScreen ? "space-between" : "center"}
          p={15}
          style={{
            width: "100%",
          }}
        >
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />

          <Box
            style={{
              width: isSmallScreen ? "auto" : "50%",
              maxWidth: isSmallScreen ? "none" : 500,
            }}
          >
            <SpotlightSearch isSmallScreen={isSmallScreen ?? false} />
          </Box>
        </Flex>
      </AppShell.Header>
      <SideNav />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
