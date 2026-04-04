import { Box } from "@mantine/core";
import { VariableSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import Loading from "../Loader/Loader";
import WorkspaceNavItem from "./WorkspaceNavItem";
import { WorkspaceWithPin } from "../../types";
import { NavItemProps } from "../../hooks/useSideNav";
import classes from "./SideNav.module.css";

interface WorkspacesListProps {
  workspaceItems: WorkspaceWithPin[];
  hasMore: boolean;
  isFetching: boolean;
  isInsertingWorkspace: boolean;
  openItem: string | null;
  loadingWorkspaceId: string | null;
  loadedSnippets: Record<string, any>;
  isActive: (path?: string) => boolean;
  onToggleItem: (id: string) => void;
  onUpdatePinnedStatus: (workspace: WorkspaceWithPin) => void;
  onLoadMore: (startIndex: number, stopIndex: number) => void;
  getItemSize: (index: number) => number;
  transformWorkspace: (workspace: WorkspaceWithPin, snippets: any) => NavItemProps;
  listRef: React.MutableRefObject<VariableSizeList | null>;
  itemRefs: React.MutableRefObject<Record<string, HTMLAnchorElement | null>>;
}

const WorkspacesList = ({
  workspaceItems,
  hasMore,
  isFetching,
  isInsertingWorkspace,
  openItem,
  loadingWorkspaceId,
  loadedSnippets,
  isActive,
  onToggleItem,
  onUpdatePinnedStatus,
  onLoadMore,
  getItemSize,
  transformWorkspace,
  listRef,
  itemRefs,
}: WorkspacesListProps) => {
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
        isActive={isActive}
        isExpanded={openItem === child.id}
        isLoading={loadingWorkspaceId === child.id}
        onToggle={onToggleItem}
        onUpdatePinnedStatus={onUpdatePinnedStatus}
        loadedSnippets={loadedSnippets}
        itemRef={(el) => {
          itemRefs.current[child.id] = el;
        }}
      />
    );
  };

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={hasMore ? workspaceItems.length + 1 : workspaceItems.length}
      loadMoreItems={onLoadMore}
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
