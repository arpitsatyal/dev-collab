import { AppShell, Box, Burger, Flex } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import SideNav from "../SideNav/SideNav";
import SpotlightSearch from "../Search/SpotlightSearch";
import { useRouter } from "next/router";
import DevCollabIcon from "../DevCollabIcon";
import ThemeToggle from "../Theme/ThemeToggle";
import { useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ResizeHandle from "./ResizeHandler";

export default function Layout({ children }: any) {
  const [opened, { toggle }] = useDisclosure();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const router = useRouter();

  const [navWidth, setNavWidth] = useState(300);
  const navbarRef = useRef(null);

  return (
    <DndProvider backend={HTML5Backend}>
      <AppShell
        header={{ height: 80 }}
        navbar={{
          width: navWidth,
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
            <Burger
              opened={opened}
              onClick={toggle}
              size="sm"
              hiddenFrom="sm"
            />

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

            {!isSmallScreen ? <ThemeToggle /> : <></>}
          </Flex>
        </AppShell.Header>
        <AppShell.Navbar p="md" ref={navbarRef}>
          <SideNav />
          <ResizeHandle navbarRef={navbarRef} setNavWidth={setNavWidth} />
        </AppShell.Navbar>
        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    </DndProvider>
  );
}
