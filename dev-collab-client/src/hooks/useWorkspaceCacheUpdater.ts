import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setInsertingWorkspace } from "../store/slices/workspaceSlice";
import { workspaceApi } from "../store/api/workspaceApi";
import { WorkspaceWithPin } from "../types";

export const useWorkspaceCacheUpdater = () => {
  const dispatch = useAppDispatch();
  const { pageSize } = useAppSelector((state) => state.workspace);

  const updateWorkspaceInCache = (compareId: string, workspace: WorkspaceWithPin) => {
    dispatch(setInsertingWorkspace(true));
    dispatch(
      workspaceApi.util.updateQueryData(
        "getWorkspaces",
        { skip: 0, limit: pageSize },
        (draft) => {
          draft.items = draft.items.filter((p) => p.id !== compareId);
          draft.items.unshift(workspace);
          if (draft.items.length > pageSize) {
            draft.items = draft.items.slice(0, pageSize);
          }
        }
      )
    );

    setTimeout(() => {
      dispatch(setInsertingWorkspace(false));
    }, 100);
  };

  return updateWorkspaceInCache;
};
