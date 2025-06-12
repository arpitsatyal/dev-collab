import { AppShell, Box, Burger, Flex } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import SideNav from "../SideNav/SideNav";
import SpotlightSearch from "../Search/SpotlightSearch";
import { useRouter } from "next/router";
import DevCollabIcon from "../DevCollabIcon";
import ThemeToggle from "../Theme/ThemeToggle";
import { useEffect, useRef, useState } from "react";
import ResizeHandle from "./ResizeHandler";
import Loading from "../Loader/Loader";

export default function Layout({ children }: any) {
  const router = useRouter();
  const [opened, { toggle }] = useDisclosure();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const navbarRef = useRef(null);
  const [navWidth, setNavWidth] = useState(400);
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle router events for loading state
  useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true);
    const handleRouteChangeComplete = () => setIsNavigating(false);
    const handleRouteChangeError = () => setIsNavigating(false);

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router]);

  return (
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

          {!isSmallScreen ? <ThemeToggle /> : <></>}
        </Flex>
      </AppShell.Header>
      <AppShell.Navbar p="md" ref={navbarRef}>
        <SideNav />
        <ResizeHandle navbarRef={navbarRef} setNavWidth={setNavWidth} />
      </AppShell.Navbar>
      <AppShell.Main>{isNavigating ? <Loading /> : children}</AppShell.Main>
    </AppShell>
  );
}
