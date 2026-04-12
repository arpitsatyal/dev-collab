import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { IconFolder } from "@tabler/icons-react";
import { useAppDispatch } from "../../../store/hooks";
import { setWorkspacesOpen } from "../../../store/slices/workspaceSlice";
import { useWorkspaceCacheUpdater } from "../../../hooks/useWorkspaceCacheUpdater";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { filterByQuery } from "../../../utils/search";
import { WorkspaceWithPin, TypedItems } from "../../../types";

export const WorkspaceSearchGroup = () => {
  const { query, workspaces, matchedResults, isSearchLoading, addRecentItems } =
    useSpotlightSearchContext();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const updateQueryData = useWorkspaceCacheUpdater();

  const items = useMemo(() => {
    const localWorkspaces = filterByQuery(
      workspaces ?? [],
      query,
      false,
      (w) => w.title,
    );
    const apiWorkspaces =
      !isSearchLoading && matchedResults?.length > 0
        ? (matchedResults.filter(
            (apiResult: TypedItems) =>
              apiResult.type === "workspace" &&
              !localWorkspaces.some((local) => local.id === apiResult.id),
          ) as WorkspaceWithPin[])
        : [];

    const combined = [...localWorkspaces, ...apiWorkspaces];

    return combined.map(
      (workspace) =>
        ({
          id: workspace.id,
          title: workspace.title,
          description: workspace.description ?? "-",
          icon: <IconFolder size={24} stroke={1.5} />,
          onClick: () => {
            const isWorkspaceLoaded = workspaces?.find(
              (loaded) => loaded.id === workspace.id,
            );

            if (!isWorkspaceLoaded) {
              updateQueryData(workspace.id, workspace);
            }
            dispatch(setWorkspacesOpen(true));
            addRecentItems([{ ...workspace, type: "workspace" } as TypedItems]);
            router.push(`/workspaces/${workspace.id}`);
          },
          groupLabel: "Workspaces",
        }) as DataItem,
    );
  }, [
    query,
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
      label="Workspaces"
      groupLabel={`${items.length} ${items.length === 1 ? "Result" : "Results"}`}
    >
      {items.map((item) => (
        <ActionItem key={item.id} item={item} />
      ))}
    </CollapsibleActionsGroup>
  );
};
