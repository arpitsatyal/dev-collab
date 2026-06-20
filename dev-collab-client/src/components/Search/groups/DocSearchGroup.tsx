import React, { useMemo } from "react";
import { IconFileText } from "@tabler/icons-react";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { getDisplayTitle } from "../../../utils/search";
import { TypedItem, TypedItems } from "../../../types";
import { useSearchItemHandler } from "../../../hooks/useSearchItemHandler";

export const DocSearchGroup = () => {
  const { workspaces, matchedResults, isSearchLoading } =
    useSpotlightSearchContext();
  const { handleItemClick } = useSearchItemHandler();

  const items = useMemo(() => {
    if (isSearchLoading || !matchedResults?.length) return [];

    const mapDocToDataItem = (doc: TypedItem<"doc">): DataItem => ({
      id: doc.id,
      title: getDisplayTitle(doc),
      icon: <IconFileText size={24} stroke={1.5} />,
      onClick: () =>
        handleItemClick(doc, `/workspaces/${doc.workspaceId}/docs/${doc.id}`),
      groupLabel: "Documents",
      meta: {
        workspaceTitle:
          workspaces?.find((w) => w.id === doc.workspaceId)?.title ?? "",
      },
    });

    return matchedResults
      .filter((res: TypedItems): res is TypedItem<"doc"> => res.type === "doc")
      .map(mapDocToDataItem);
  }, [workspaces, matchedResults, isSearchLoading, handleItemClick]);

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
