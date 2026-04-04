import { AppShell, Box, Text } from "@mantine/core";
import classes from "./SideNav.module.css";
import Loading from "../Loader/Loader";
import SideNavFooter from "./SideNavFooter";
import NavItem from "./NavItem";
import WorkspacesList from "./WorkspacesList";
import { useSideNav } from "../../hooks/useSideNav";
import { SideNavProvider } from "./SideNavContext";

const SideNav = () => {
  const sideNavData = useSideNav();
  const {
    navItemsWithWorkspaces,
    workspaceItems,
    isLoading,
    isInsertingWorkspace,
    isActive,
    isOpen,
    handleNavClick,
  } = sideNavData;

  return (
    <SideNavProvider value={sideNavData}>
      <AppShell.Section grow my="md" className={classes.section}>
        {navItemsWithWorkspaces.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={isActive(item.path, item.id)}
            opened={isOpen(item)}
            onClick={() => handleNavClick(item.path, item.handler, item.label)}
          >
            {item.label === "Workspaces" && (
              <Box pr="xs">
                {isLoading ? (
                  <Loading />
                ) : isInsertingWorkspace ? (
                  <Loading loaderHeight="20vh" />
                ) : workspaceItems.length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center" py="sm" fs="italic">
                    No workspaces added yet
                  </Text>
                ) : (
                  <WorkspacesList />
                )}
              </Box>
            )}
          </NavItem>
        ))}
      </AppShell.Section>

      <SideNavFooter />
    </SideNavProvider>
  );
};

export default SideNav;
