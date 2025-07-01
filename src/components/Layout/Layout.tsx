import { AppShell, Box, Burger, Button, Flex } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import SideNav from "../SideNav/SideNav";
import SpotlightSearch from "../Search/SpotlightSearch";
import { useRouter } from "next/router";
import DevCollabIcon from "../DevCollabIcon";
import ThemeToggle from "../Theme/ThemeToggle";
import { ReactNode, useEffect, useRef, useState } from "react";
import ResizeHandle from "./ResizeHandler";
import Loading from "../Loader/Loader";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setProjectsOpen } from "../../store/slices/projectSlice";
import {
  useGetProjectByIdQuery,
  useGetProjectsQuery,
} from "../../store/api/projectApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useProjectCacheUpdater } from "../../hooks/useProjectCacheUpdater";
import { IconMenu2 } from "@tabler/icons-react";

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [opened, { toggle }] = useDisclosure();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const navbarRef = useRef(null);
  const [navWidth, setNavWidth] = useState(400);
  const [isNavigating, setIsNavigating] = useState(false);
  const dispatch = useAppDispatch();
  const { pageSize, skip } = useAppSelector((state) => state.project);
  const { data, isLoading: isProjectsLoading } = useGetProjectsQuery({
    skip,
    limit: pageSize,
  });
  const updateQueryData = useProjectCacheUpdater();

  const loadedProjects = data?.items;
  const projectId = router.query.projectId;
  const isValidProjectId =
    typeof projectId === "string" && projectId.trim() !== "";

  const isProjectLoaded = loadedProjects?.find(
    (loaded) => loaded.id === projectId
  );

  const { data: projectData } = useGetProjectByIdQuery(
    isValidProjectId && !isProjectLoaded ? projectId : skipToken
  );

  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(false);
  const isDocsRoute = router.pathname.startsWith("/projects/[projectId]/docs");

  const handleToggleSideNav = () => {
    setIsSideNavCollapsed(!isSideNavCollapsed);
  };

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

  useEffect(() => {
    if (isValidProjectId) {
      dispatch(setProjectsOpen(true));

      if (!isProjectLoaded && projectData) {
        updateQueryData(projectId, projectData);
      }
    }
  }, [
    projectId,
    isValidProjectId,
    projectData,
    isProjectLoaded,
    router,
    dispatch,
    updateQueryData,
  ]);

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
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconMenu2 size={16} />}
              onClick={handleToggleSideNav}
            >
              {isSideNavCollapsed ? "Show Main Menu" : "Hide Main Menu"}
            </Button>
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
        {isNavigating || isProjectsLoading ? <Loading /> : children}
      </AppShell.Main>
    </AppShell>
  );
}
