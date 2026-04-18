import React, { useMemo } from "react";
import { useRouter } from "next/router";
import {
  IconFolder,
  IconSubtask,
  IconFileText,
  IconMessage,
} from "@tabler/icons-react";
import { useAppDispatch } from "../../../store/hooks";
import { setWorkspacesOpen } from "../../../store/slices/workspaceSlice";
import { useWorkspaceCacheUpdater } from "../../../hooks/useWorkspaceCacheUpdater";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { filterByQuery, getDisplayTitle } from "../../../utils/search";
import FileIcon from "../../shared/FileIcon";

export const RecentSearchGroup = () => {
  const {
    query,
    workspaces,
    snippets,
    matchedResults,
    recentSearchOrder,
    recentItems,
  } = useSpotlightSearchContext();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const updateQueryData = useWorkspaceCacheUpdater();

  const items = useMemo(() => {
    const hasOtherResults =
      filterByQuery(workspaces ?? [], query)?.length > 0 ||
      filterByQuery(snippets ?? [], query)?.length > 0 ||
      (matchedResults && matchedResults.length > 0);

    if (hasOtherResults && query.length > 0) {
      return [];
    }

    const sortedResults = [...recentItems].sort((a, b) => {
      const aKey = `${a.type}:${a.id}`;
      const bKey = `${b.type}:${b.id}`;
      const aIndex = recentSearchOrder?.indexOf(aKey) ?? -1;
      const bIndex = recentSearchOrder?.indexOf(bKey) ?? -1;

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    const filteredResults = filterByQuery(sortedResults, query, true, (item) =>
      getDisplayTitle(item),
    );

    return filteredResults.map((item) => {
      const title = getDisplayTitle(item);
      const baseItem = {
        id: item.id,
        title,
        groupLabel: "Recently Searched",
      };

      const navigateWithWorkspace = (
        wId: string,
        path: string,
        wData?: any,
      ) => {
        const isLoaded = workspaces?.find((w) => w.id === wId);
        if (!isLoaded && wData) {
          updateQueryData(wId, wData);
        }
        dispatch(setWorkspacesOpen(true));
        router.push(path);
      };

      switch (item.type) {
        case "workspace":
          return {
            ...baseItem,
            description: item.description ?? "-",
            icon: <IconFolder size={24} stroke={1.5} />,
            onClick: () =>
              navigateWithWorkspace(item.id, `/workspaces/${item.id}`, item),
          } as DataItem;

        case "snippet":
          return {
            ...baseItem,
            icon: <FileIcon snippet={item} />,
            onClick: () =>
              navigateWithWorkspace(
                item.workspaceId,
                `/workspaces/${item.workspaceId}/snippets/${item.id}`,
                item.workspace,
              ),
            meta: {
              workspaceTitle:
                workspaces?.find((w) => w.id === item.workspaceId)?.title ?? "",
            },
          } as DataItem;

        case "workItem":
          return {
            ...baseItem,
            description: item.description ?? "-",
            icon: <IconSubtask size={24} stroke={1.5} />,
            onClick: () =>
              navigateWithWorkspace(
                item.workspaceId,
                `/workspaces/${item.workspaceId}/work-items`,
                item.workspace,
              ),
            meta: {
              workspaceTitle:
                workspaces?.find((w) => w.id === item.workspaceId)?.title ?? "",
            },
          } as DataItem;

        case "doc":
          return {
            ...baseItem,
            description: "-",
            icon: <IconFileText size={24} stroke={1.5} />,
            onClick: () =>
              navigateWithWorkspace(
                item.workspaceId,
                `/workspaces/${item.workspaceId}/docs/${item.id}`,
                item.workspace,
              ),
            meta: {
              workspaceTitle:
                workspaces?.find((w) => w.id === item.workspaceId)?.title ?? "",
            },
          } as DataItem;

        case "chat":
          return {
            ...baseItem,
            icon: <IconMessage size={24} stroke={1.5} />,
            onClick: () => {
              dispatch(setWorkspacesOpen(true));
              router.push(`/chats/${item.id}`);
            },
          } as DataItem;

        default:
          return {
            ...baseItem,
            id: "unknown",
            icon: <IconFolder />,
            onClick: () => { },
          } as DataItem;
      }
    });
  }, [
    query,
    workspaces,
    snippets,
    matchedResults,
    recentItems,
    recentSearchOrder,
    dispatch,
    router,
    updateQueryData,
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
