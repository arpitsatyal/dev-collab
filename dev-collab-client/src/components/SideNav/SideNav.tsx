import { AppShell, Box, Text } from "@mantine/core";
import classes from "./SideNav.module.css";
import Loading from "../Loader/Loader";
import SideNavFooter from "./SideNavFooter";
import { WorkspaceWithPin } from "../../types";
import NavItem from "./NavItem";
import WorkspacesList from "./WorkspacesList";
import { useSideNav } from "../../hooks/useSideNav";

const SideNav = () => {
  const {
    navItemsWithWorkspaces,
    workspaceItems,
    isLoading,
    isFetching,
    isInsertingWorkspace,
    hasMore,
    openItem,
    loadingWorkspaceId,
    loadedSnippets,
    listRef,
    itemRefs,
    isActive,
    isOpen,
    setOpenItem,
    handleNavClick,
    handleUpdatePinnedStatus,
    loadMoreItems,
    getItemSize,
    transformWorkspace,
  } = useSideNav();

  return (
    <>
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
                  <WorkspacesList
                    workspaceItems={workspaceItems as WorkspaceWithPin[]}
                    hasMore={hasMore}
                    isFetching={isFetching}
                    isInsertingWorkspace={isInsertingWorkspace}
                    openItem={openItem}
                    loadingWorkspaceId={loadingWorkspaceId}
                    loadedSnippets={loadedSnippets}
                    isActive={isActive}
                    onToggleItem={(id) => setOpenItem((prev) => (prev === id ? null : id))}
                    onUpdatePinnedStatus={handleUpdatePinnedStatus}
                    onLoadMore={loadMoreItems}
                    getItemSize={getItemSize}
                    transformWorkspace={transformWorkspace}
                    listRef={listRef}
                    itemRefs={itemRefs}
                  />
                )}
              </Box>
            )}
          </NavItem>
        ))}
      </AppShell.Section>

      <SideNavFooter />
    </>
  );
};

export default SideNav;
