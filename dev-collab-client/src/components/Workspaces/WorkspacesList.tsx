import { Box } from "@mantine/core";
import { VariableSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import Loading from "../Loader/Loader";
import WorkspaceNavItem from "../SideNav/WorkspaceNavItem";
import { WorkspaceWithPin } from "../../types";
import { useSideNavContext } from "../SideNav/SideNavContext";
import classes from "../SideNav/SideNav.module.css";

const WorkspacesList = () => {
  const {
    workspaceItems,
    hasMore,
    isInsertingWorkspace,
    loadedSnippets,
    loadMoreItems,
    getItemSize,
    transformWorkspace,
    listRef,
  } = useSideNavContext();

  const isItemLoaded = (index: number) => index < workspaceItems.length;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const isLoadingRow = hasMore && index === workspaceItems.length;
    if (isLoadingRow) {
      return (
        <Box style={style} key={`loading-${index}`} ta="center">
          <Loading loaderHeight="5vh" />
        </Box>
      );
    }

    const workspace = workspaceItems[isInsertingWorkspace ? index - 1 : index] as WorkspaceWithPin;
    if (!workspace) return null;

    const child = transformWorkspace(workspace, loadedSnippets);

    return (
      <WorkspaceNavItem
        key={child.id}
        index={index}
        style={style}
        workspace={workspace}
        child={child}
      />
    );
  };

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={hasMore ? workspaceItems.length + 1 : workspaceItems.length}
      loadMoreItems={loadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <VariableSizeList
          height={500}
          width="100%"
          itemCount={hasMore ? workspaceItems.length + 1 : workspaceItems.length}
          itemSize={getItemSize}
          onItemsRendered={onItemsRendered}
          ref={(list) => {
            listRef.current = list || null;
            ref(list);
          }}
          className={classes.reactWindowList}
        >
          {Row}
        </VariableSizeList>
      )}
    </InfiniteLoader>
  );
};

export default WorkspacesList;
