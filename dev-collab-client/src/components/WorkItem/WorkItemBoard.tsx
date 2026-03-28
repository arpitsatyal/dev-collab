import { Center, Grid, Text } from "@mantine/core";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { WorkItem, WorkItemStatus } from "../../types";
import { DndProvider } from "react-dnd";
import { notifications } from "@mantine/notifications";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useMediaQuery } from "@mantine/hooks";
import { getSingleQueryParam } from "../../utils/getSingleQueryParam";
import {
  useGetWorkItemsForWorkspaceQuery,
  useUpdateStatusMutation,
} from "../../store/api/workItemApi";
import Loading from "../Loader/Loader";
import WorkItemColumn from "./WorkItemColumn";

const WorkItemBoard = () => {
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId);
  const { data, isLoading } = useGetWorkItemsForWorkspaceQuery(workspaceId ?? "");
  const [localWorkItems, setLocalWorkItems] = useState<WorkItem[]>([]);
  const [updateStatus] = useUpdateStatusMutation();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

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

  if (!workspaceId || isLoading) return <Loading />;

  if (data?.length === 0) {
    return (
      <Center className="secondary">
        <Text size="lg">No work items yet, create one to get started!</Text>
      </Center>
    );
  }

  const handleDropWorkItem = async (workItemId: string, newStatus: WorkItemStatus) => {
    // Optimistic update
    const previousWorkItems = [...localWorkItems];
    setLocalWorkItems((prev) =>
      prev.map((workItem) =>
        workItem.id === workItemId ? { ...workItem, status: newStatus } : workItem
      )
    );

    try {
      await updateStatus({
        workspaceId,
        workItemId,
        newStatus,
      }).unwrap();
      notifications.show({
        title: "Job done!",
        message: "Work Item updated successfully! 🌟",
      });
    } catch (error) {
      // Revert on failure
      setLocalWorkItems(previousWorkItems);
      notifications.show({
        title: "Error",
        message: "Failed to update work item status. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <DndProvider backend={isSmallScreen ? TouchBackend : HTML5Backend}>
      <Grid gutter="lg">
        <WorkItemColumn
          title="To Do"
          workItems={todoWorkItems}
          onDropWorkItem={handleDropWorkItem}
        />
        <WorkItemColumn
          title="In Progress"
          workItems={inProgressWorkItems}
          onDropWorkItem={handleDropWorkItem}
        />
        <WorkItemColumn
          title="Done"
          workItems={doneWorkItems}
          onDropWorkItem={handleDropWorkItem}
        />
      </Grid>
    </DndProvider>
  );
};

export default WorkItemBoard;
