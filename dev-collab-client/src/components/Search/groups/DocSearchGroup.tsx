import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { IconFileText } from "@tabler/icons-react";
import { useAppDispatch } from "../../../store/hooks";
import { setWorkspacesOpen } from "../../../store/slices/workspaceSlice";
import { useWorkspaceCacheUpdater } from "../../../hooks/useWorkspaceCacheUpdater";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { getDisplayTitle } from "../../../utils/search";
import { DocWithWorkspace, TypedItems } from "../../../types";

export const DocSearchGroup = () => {
  const { workspaces, matchedResults, isSearchLoading, addRecentItems } =
    useSpotlightSearchContext();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const updateQueryData = useWorkspaceCacheUpdater();

  const items = useMemo(() => {
    const apiDocs =
      !isSearchLoading && matchedResults?.length > 0
        ? (matchedResults.filter(
          (apiResult: TypedItems) => apiResult.type === "doc"
        ) as DocWithWorkspace[])
        : [];

    return apiDocs.map((doc) => ({
      id: doc.id,
      title: getDisplayTitle({ ...doc, type: "doc" } as TypedItems),
      icon: <IconFileText size={24} stroke={1.5} />,
      onClick: () => {
        const isWorkspaceLoaded = workspaces?.find(
          (loaded) => loaded.id === doc.workspaceId
        );
        const workspace = doc.workspace;
        if (!isWorkspaceLoaded && workspace) {
          updateQueryData(doc.workspaceId, workspace);
        }
        dispatch(setWorkspacesOpen(true));
        addRecentItems([{ ...doc, type: "doc" } as TypedItems]);
        router.push(`/workspaces/${doc.workspaceId}/docs/${doc.id}`);
      },
      groupLabel: "Documents",
      meta: {
        workspaceTitle:
          workspaces?.find((workspace) => workspace.id === doc.workspaceId)?.title ?? "",
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
      label="Documents"
      groupLabel={`${items.length} ${items.length === 1 ? "Result" : "Results"}`}
    >
      {items.map((item) => (
        <ActionItem key={item.id} item={item} />
      ))}
    </CollapsibleActionsGroup>
  );
};
