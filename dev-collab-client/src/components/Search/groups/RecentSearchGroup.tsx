import React, { useMemo } from "react";
import {
  IconFolder,
  IconSubtask,
  IconFileText,
  IconMessage,
} from "@tabler/icons-react";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { filterByQuery, getDisplayTitle } from "../../../utils/search";
import FileIcon from "../../shared/FileIcon";
import { useSearchItemHandler } from "../../../hooks/useSearchItemHandler";
import { TypedItems } from "../../../types";

export const RecentSearchGroup = () => {
  const {
    query,
    workspaces,
    snippets,
    matchedResults,
    recentSearchOrder,
    recentItems,
  } = useSpotlightSearchContext();
  const { handleItemClick } = useSearchItemHandler();

  const getTargetPath = (item: TypedItems): string => {
    switch (item.type) {
      case "workspace":
        return `/workspaces/${item.id}`;
      case "snippet":
        return `/workspaces/${item.workspaceId}/snippets/${item.id}`;
      case "workItem":
        return `/workspaces/${item.workspaceId}/work-items`;
      case "doc":
        return `/workspaces/${item.workspaceId}/docs/${item.id}`;
      case "chat":
        return `/chats/${item.id}`;
      default:
        return "/";
    }
  };

  const getIcon = (item: TypedItems) => {
    switch (item.type) {
      case "workspace":
        return <IconFolder size={24} stroke={1.5} />;
      case "snippet":
        return <FileIcon snippet={item} />;
      case "workItem":
        return <IconSubtask size={24} stroke={1.5} />;
      case "doc":
        return <IconFileText size={24} stroke={1.5} />;
      case "chat":
        return <IconMessage size={24} stroke={1.5} />;
      default:
        return <IconFolder />;
    }
  };

  const items = useMemo(() => {
    const hasOtherResults =
      filterByQuery(workspaces ?? [], query).length > 0 ||
      filterByQuery(snippets ?? [], query).length > 0 ||
      (matchedResults?.length ?? 0) > 0;

    if (hasOtherResults && query.length > 0) return [];

    const sortRecentItems = (items: TypedItems[]) =>
      [...items].sort((a, b) => {
        const aIndex = recentSearchOrder?.indexOf(`${a.type}:${a.id}`) ?? -1;
        const bIndex = recentSearchOrder?.indexOf(`${b.type}:${b.id}`) ?? -1;
        return aIndex - bIndex;
      });

    const mapRecentToDataItem = (item: TypedItems): DataItem => ({
      id: item.id,
      title: getDisplayTitle(item),
      description: (item as any).description ?? "-",
      groupLabel: "Recently Searched",
      icon: getIcon(item),
      onClick: () => handleItemClick(item, getTargetPath(item)),
      meta: {
        workspaceTitle: (item as any).workspaceId
          ? workspaces?.find((w) => w.id === (item as any).workspaceId)?.title ?? ""
          : "",
      },
    });

    const sorted = sortRecentItems(recentItems);

    return filterByQuery(sorted, query, true, getDisplayTitle)
      .map(mapRecentToDataItem);
  }, [
    query,
    workspaces,
    snippets,
    matchedResults,
    recentItems,
    recentSearchOrder,
    handleItemClick,
  ]);

  if (!items.length) return null;

  return (
    <CollapsibleActionsGroup
      label="Recently Searched"
      groupLabel={`${items.length} ${items.length === 1 ? "Result" : "Results"}`}
    >
      {items.map((item) => (
        <ActionItem key={`recent-${item.id}`} item={item} />
      ))}
    </CollapsibleActionsGroup>
  );
};
