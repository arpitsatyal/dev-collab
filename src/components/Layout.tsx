import { AppShell, Box, Burger, Flex } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import SideNav from "./SideNav";
import SpotlightSearch from "./SpotlightSearch";
import { useRouter } from "next/router";
import DevCollabIcon from "./DevCollabIcon";

export default function Layout({ children }: any) {
  const [opened, { toggle }] = useDisclosure();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const router = useRouter();

  return (
    <AppShell
      header={{ height: 80 }}
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
          justify="space-between"
          p={15}
          style={{
            width: "100%",
          }}
        >
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />

          <Box onClick={() => router.push("/")}>
            <DevCollabIcon />
          </Box>

          <Box
            style={{
              width: isSmallScreen ? "auto" : "50%",
              maxWidth: isSmallScreen ? "none" : 500,
            }}
          >
            <SpotlightSearch isSmallScreen={isSmallScreen ?? false} />
          </Box>

          {!isSmallScreen ? <Box></Box> : <></>}
        </Flex>
      </AppShell.Header>
      <SideNav />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
