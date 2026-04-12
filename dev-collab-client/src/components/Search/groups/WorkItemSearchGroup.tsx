import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { IconSubtask } from "@tabler/icons-react";
import { useAppDispatch } from "../../../store/hooks";
import { setWorkspacesOpen } from "../../../store/slices/workspaceSlice";
import { useWorkspaceCacheUpdater } from "../../../hooks/useWorkspaceCacheUpdater";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { WorkItem, WorkspaceWithPin, TypedItems } from "../../../types";

export const WorkItemSearchGroup = () => {
  const { workspaces, matchedResults, isSearchLoading, addRecentItems } =
    useSpotlightSearchContext();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const updateQueryData = useWorkspaceCacheUpdater();

  const items = useMemo(() => {
    const apiWorkItems =
      !isSearchLoading && matchedResults?.length > 0
        ? (matchedResults.filter(
            (apiResult: TypedItems) => apiResult.type === "workItem"
          ) as (WorkItem & { workspace?: WorkspaceWithPin })[])
        : [];

    return apiWorkItems.map((workItem) => ({
      id: workItem.id,
      title: workItem.title,
      description: workItem.description ?? "-",
      icon: <IconSubtask size={24} stroke={1.5} />,
      onClick: () => {
        const isWorkspaceLoaded = workspaces?.find(
          (loaded) => loaded.id === workItem.workspaceId
        );
        const workspace = workItem.workspace;
        if (!isWorkspaceLoaded && workspace) {
          updateQueryData(workItem.workspaceId, workspace);
        }
        dispatch(setWorkspacesOpen(true));
        addRecentItems([{ ...workItem, type: "workItem" } as TypedItems]);
        router.push(`/workspaces/${workItem.workspaceId}/work-items`);
      },
      groupLabel: "Work Items",
      meta: {
        workspaceTitle:
          workspaces?.find((workspace) => workspace.id === workItem.workspaceId)?.title ??
          "",
      },
    } as DataItem));
  }, [
    workspaces,
    matchedResults,
    isSearchLoading,
    addRecentItems,
    dispatch,
    router,
    updateQueryData,
  ]);

  if (!items.length) return null;

  return (
    <CollapsibleActionsGroup
      label="Work Items"
      groupLabel={`${items.length} ${items.length === 1 ? "Result" : "Results"}`}
    >
      {items.map((item) => (
        <ActionItem key={item.id} item={item} />
      ))}
    </CollapsibleActionsGroup>
  );
};
