import React, { useMemo } from "react";
import { IconSubtask } from "@tabler/icons-react";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { TypedItem, TypedItems } from "../../../types";
import { useSearchItemHandler } from "../../../hooks/useSearchItemHandler";

export const WorkItemSearchGroup = () => {
  const { workspaces, matchedResults, isSearchLoading } =
    useSpotlightSearchContext();
  const { handleItemClick } = useSearchItemHandler();

  const items = useMemo(() => {
    if (isSearchLoading || !matchedResults?.length) return [];

    const mapWorkItemToDataItem = (
      workItem: TypedItem<"workItem">,
    ): DataItem => ({
      id: workItem.id,
      title: workItem.title,
      description: workItem.description ?? "-",
      icon: <IconSubtask size={24} stroke={1.5} />,
      onClick: () =>
        handleItemClick(workItem, `/workspaces/${workItem.workspaceId}/work-items`),
      groupLabel: "Work Items",
      meta: {
        workspaceTitle:
          workspaces?.find((w) => w.id === workItem.workspaceId)?.title ?? "",
      },
    });

    return matchedResults
      .filter(
        (res: TypedItems): res is TypedItem<"workItem"> =>
          res.type === "workItem",
      )
      .map(mapWorkItemToDataItem);
  }, [workspaces, matchedResults, isSearchLoading, handleItemClick]);

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
