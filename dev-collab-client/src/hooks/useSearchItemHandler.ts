import { useRouter } from "next/router";
import { useAppDispatch } from "../store/hooks";
import { setWorkspacesOpen } from "../store/slices/workspaceSlice";
import { useWorkspaceCacheUpdater } from "./useWorkspaceCacheUpdater";
import { useSpotlightSearchContext } from "../components/Search/SearchContext";
import { TypedItems, WorkspaceWithPin } from "../types";

export const useSearchItemHandler = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const updateQueryData = useWorkspaceCacheUpdater();
  const { workspaces, addRecentItems } = useSpotlightSearchContext();

  const handleItemClick = (
    item: TypedItems & { workspace?: WorkspaceWithPin },
    targetPath: string
  ) => {
    // 1. Handle Workspace Cache (if the item has workspace info)
    const workspaceId = (item as any).workspaceId;
    if (workspaceId) {
      const isWorkspaceLoaded = workspaces?.some((w) => w.id === workspaceId);
      const workspace = item.workspace;

      if (!isWorkspaceLoaded && workspace) {
        updateQueryData(workspaceId, workspace);
      }
    }

    // 2. Update Global App State
    dispatch(setWorkspacesOpen(true));

    // 3. Track History
    addRecentItems([item]);

    // 4. Navigate
    router.push(targetPath);
  };

  return { handleItemClick };
};
