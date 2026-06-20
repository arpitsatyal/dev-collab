import React, { useMemo } from "react";
import { useAppSelector } from "../../../store/hooks";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { filterByQuery, getDisplayTitle } from "../../../utils/search";
import { TypedItem, TypedItems } from "../../../types";
import FileIcon from "../../shared/FileIcon";
import { useSearchItemHandler } from "../../../hooks/useSearchItemHandler";

export const SnippetSearchGroup = () => {
  const { query, workspaces, matchedResults, isSearchLoading } =
    useSpotlightSearchContext();
  const { handleItemClick } = useSearchItemHandler();

  const snippets = Object.values(
    useAppSelector((state) => state.snippet.loadedSnippets),
  ).flat();

  const items = useMemo(() => {
    const mapSnippetToDataItem = (snippet: TypedItem<"snippet">): DataItem => ({
      id: snippet.id,
      title: getDisplayTitle(snippet),
      icon: <FileIcon snippet={snippet} />,
      onClick: () =>
        handleItemClick(
          snippet,
          `/workspaces/${snippet.workspaceId}/snippets/${snippet.id}`,
        ),
      groupLabel: "Snippets",
      meta: {
        workspaceTitle:
          workspaces?.find((w) => w.id === snippet.workspaceId)?.title ?? "",
      },
    });

    const localTyped: TypedItem<"snippet">[] = filterByQuery(
      snippets,
      query,
      false,
      (s) => s.title,
    ).map((s) => ({ ...s, type: "snippet" }));

    const apiSnippets =
      !isSearchLoading && matchedResults?.length > 0
        ? matchedResults.filter(
          (res: TypedItems): res is TypedItem<"snippet"> =>
            res.type === "snippet" &&
            !localTyped.some((local) => local.id === res.id),
        )
        : [];

    return [...localTyped, ...apiSnippets].map(mapSnippetToDataItem);
  }, [query, snippets, workspaces, matchedResults, isSearchLoading, handleItemClick]);

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
