import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setWorkspacesOpen } from "../../../store/slices/workspaceSlice";
import { useWorkspaceCacheUpdater } from "../../../hooks/useWorkspaceCacheUpdater";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { filterByQuery, getDisplayTitle } from "../../../utils/search";
import { Snippet, WorkspaceWithPin, TypedItems } from "../../../types";
import FileIcon from "../../shared/FileIcon";

export const SnippetSearchGroup = () => {
  const { query, workspaces, matchedResults, isSearchLoading, addRecentItems } =
    useSpotlightSearchContext();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const updateQueryData = useWorkspaceCacheUpdater();

  const snippets = Object.values(
    useAppSelector((state) => state.snippet.loadedSnippets),
  ).flat();

  const items = useMemo(() => {
    const localSnippets = filterByQuery(snippets, query, false, (s) => s.title);
    const apiSnippets =
      !isSearchLoading && matchedResults?.length > 0
        ? (matchedResults.filter(
            (apiResult: TypedItems) =>
              apiResult.type === "snippet" &&
              !localSnippets.some((local) => local.id === apiResult.id),
          ) as (Snippet & { workspace?: WorkspaceWithPin })[])
        : [];

    const combined = [...localSnippets, ...apiSnippets];

    return combined.map(
      (snippet) =>
        ({
          id: snippet.id,
          title: getDisplayTitle({ ...snippet, type: "snippet" } as TypedItems),
          icon: <FileIcon snippet={snippet} />,
          onClick: () => {
            const isWorkspaceLoaded = workspaces?.find(
              (loaded) => loaded.id === snippet.workspaceId,
            );
            const workspace = (snippet as any).workspace;
            if (!isWorkspaceLoaded && workspace) {
              updateQueryData(snippet.workspaceId, workspace);
            }
            dispatch(setWorkspacesOpen(true));
            addRecentItems([{ ...snippet, type: "snippet" } as TypedItems]);
            router.push(
              `/workspaces/${snippet.workspaceId}/snippets/${snippet.id}`,
            );
          },
          groupLabel: "Snippets",
          meta: {
            workspaceTitle:
              workspaces?.find(
                (workspace) => workspace.id === snippet.workspaceId,
              )?.title ?? "",
          },
        }) as DataItem,
    );
  }, [
    query,
    snippets,
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
      label="Snippets"
      groupLabel={`${items.length} ${items.length === 1 ? "Result" : "Results"}`}
    >
      {items.map((item) => (
        <ActionItem key={item.id} item={item} />
      ))}
    </CollapsibleActionsGroup>
  );
};
