import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { WorkItem, WorkItemStatus } from "../types";
import { useMediaQuery } from "@mantine/hooks";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getSingleQueryParam } from "../utils/navigation/queryParams";
import { useGetWorkItemsForWorkspaceQuery } from "../store/api/workItemApi";
import { useWorkItemMutations } from "./mutations/useWorkItemMutations";

export const useWorkItemBoard = () => {
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId);
  const { data, isLoading } = useGetWorkItemsForWorkspaceQuery(workspaceId ?? "");
  const [localWorkItems, setLocalWorkItems] = useState<WorkItem[]>([]);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const { handleDropWorkItem } = useWorkItemMutations({
    workspaceId: workspaceId ?? null,
    localWorkItems,
    setLocalWorkItems,
  });

  const todoWorkItems = useMemo(
    () => localWorkItems.filter((workItem) => workItem.status === WorkItemStatus.TODO),
    [localWorkItems]
  );
  const inProgressWorkItems = useMemo(
    () => localWorkItems.filter((workItem) => workItem.status === WorkItemStatus.IN_PROGRESS),
    [localWorkItems]
  );
  const doneWorkItems = useMemo(
    () => localWorkItems.filter((workItem) => workItem.status === WorkItemStatus.DONE),
    [localWorkItems]
  );

  useEffect(() => {
    setLocalWorkItems(data ?? []);
  }, [data]);

  const dndBackend = isSmallScreen ? TouchBackend : HTML5Backend;

  return {
    workspaceId,
    isLoading,
    data,
    todoWorkItems,
    inProgressWorkItems,
    doneWorkItems,
    handleDropWorkItem,
    dndBackend,
  };
};
