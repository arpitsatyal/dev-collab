import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setInsertingProject } from "../store/slices/projectSlice";
import { projectApi } from "../store/api/projectApi";
import { ProjectWithPin } from "../types";

export const useProjectCacheUpdater = () => {
  const dispatch = useAppDispatch();
  const { pageSize } = useAppSelector((state) => state.project);

  const updateProjectInCache = (compareId: string, project: ProjectWithPin) => {
    dispatch(setInsertingProject(true));
    dispatch(
      projectApi.util.updateQueryData(
        "getProjects",
        { skip: 0, limit: pageSize },
        (draft) => {
          draft.items = draft.items.filter((p) => p.id !== compareId);
          draft.items.unshift(project);
          if (draft.items.length > pageSize) {
            draft.items = draft.items.slice(0, pageSize);
          }
        }
      )
    );

    setTimeout(() => {
      dispatch(setInsertingProject(false));
    }, 100);
  };

  return updateProjectInCache;
};
