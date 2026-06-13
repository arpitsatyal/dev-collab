import BaseButton from "../shared/base/BaseButton";
import { AppShell, Box, Burger, Flex } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import SideNav from "../SideNav/SideNav";
import SpotlightSearch from "../Search/SpotlightSearch";
import ThemeToggle from "../Theme/ThemeToggle";
import { ReactNode, useRef, useState } from "react";
import ResizeHandle from "./ResizeHandler";
import BaseLoader from "../shared/base/BaseLoader";
import { IconMenu2 } from "@tabler/icons-react";
import AIChat from "../AIChat/AIChat";
import DevCollabIcon from "../shared/DevCollabIcon";
import { useAppOrchestration } from "../../hooks/useAppOrchestration";

export default function Layout({ children }: { children: ReactNode }) {
  const { isNavigating, isWorkspacesLoading, router } = useAppOrchestration();
  const [opened, { toggle }] = useDisclosure();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const navbarRef = useRef(null);
  const [navWidth, setNavWidth] = useState(400);
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(false);

  const isDocsRoute = router.pathname.startsWith(
    "/workspaces/[workspaceId]/docs",
  );

  const handleToggleSideNav = () => {
    setIsSideNavCollapsed(!isSideNavCollapsed);
  };

  return (
    <AppShell
      header={{ height: 80 }}
      navbar={{
        width: isSideNavCollapsed ? 0 : navWidth,
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
          style={{ width: "100%" }}
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
          {!isSmallScreen && isDocsRoute && (
            <BaseButton
              variant="outline"
              size="xs"
              leftSection={<IconMenu2 size={16} />}
              onClick={handleToggleSideNav}
            >
              {isSideNavCollapsed ? "Show Main Menu" : "Hide Main Menu"}
            </BaseButton>
          )}
          {!isSmallScreen && !isDocsRoute && <ThemeToggle />}
        </Flex>
      </AppShell.Header>
      <AppShell.Navbar p="md" ref={navbarRef}>
        <SideNav />
        {!isSideNavCollapsed && (
          <ResizeHandle navbarRef={navbarRef} setNavWidth={setNavWidth} />
        )}
      </AppShell.Navbar>
      <AppShell.Main>
        {isNavigating || isWorkspacesLoading ? <BaseLoader /> : children}
      </AppShell.Main>
      <AIChat />
    </AppShell>
  );
}
