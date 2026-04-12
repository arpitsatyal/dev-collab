import { Box, Text } from "@mantine/core";
import Loading from "../Loader/Loader";
import WorkspacesList from "../Workspaces/WorkspacesList";
import { useSideNavContext } from "./SideNavContext";
import { NavItemProps } from "../../hooks/useSideNavData";

interface SideNavNestedContentProps {
  item: NavItemProps;
}

const SideNavNestedContent = ({ item }: SideNavNestedContentProps) => {
  const { workspaceItems, isLoading, isInsertingWorkspace } = useSideNavContext();

  return (
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
  );
};

export default SideNavNestedContent;
