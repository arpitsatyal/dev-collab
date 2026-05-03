import React, { useMemo } from "react";
import { IconFolder } from "@tabler/icons-react";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { filterByQuery } from "../../../utils/search";
import { TypedItem, TypedItems } from "../../../types";

import { useSearchItemHandler } from "../../../hooks/useSearchItemHandler";

export const WorkspaceSearchGroup = () => {
  const { query, workspaces, matchedResults, isSearchLoading } =
    useSpotlightSearchContext();
  const { handleItemClick } = useSearchItemHandler();

  const mapWorkspaceToDataItem = (
    workspace: TypedItem<"workspace">,
  ): DataItem => ({
    id: workspace.id,
    title: workspace.title,
    description: workspace.description ?? "-",
    icon: <IconFolder size={24} stroke={1.5} />,
    onClick: () => handleItemClick(workspace, `/workspaces/${workspace.id}`),
    groupLabel: "Workspaces",
  });

  const items = useMemo(() => {
    const localTyped: TypedItem<"workspace">[] = filterByQuery(
      workspaces ?? [],
      query,
      false,
      (w) => w.title,
    ).map((w) => ({ ...w, type: "workspace" }));

    const apiWorkspaces =
      !isSearchLoading && matchedResults?.length > 0
        ? matchedResults.filter(
            (res: TypedItems): res is TypedItem<"workspace"> =>
              res.type === "workspace" &&
              !localTyped.some((local) => local.id === res.id),
          )
        : [];

    return [...localTyped, ...apiWorkspaces].map(mapWorkspaceToDataItem);
  }, [query, workspaces, matchedResults, isSearchLoading, handleItemClick]);

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
