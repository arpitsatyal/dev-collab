import { Grid } from "@mantine/core";
import React from "react";
import { DndProvider } from "react-dnd";
import BaseLoader from "../shared/base/BaseLoader";
import WorkItemColumn from "./WorkItemColumn";
import BoardEmptyState from "./BoardEmptyState";
import { useWorkItemBoard } from "../../hooks/useWorkItemBoard";
import { WorkItemStatus } from "../../types";

const statusToTitle = (status: string) => {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const WorkItemBoard = () => {
  const {
    workspaceId,
    isLoading,
    data,
    workItemsByStatus,
    handleDropWorkItem,
    dndBackend } = useWorkItemBoard();

  if (!workspaceId || isLoading) return <BaseLoader />;

  if (data?.length === 0) {
    return <BoardEmptyState />;
  }

  return (
    <DndProvider backend={dndBackend}>
      <Grid gutter="lg">
        {Object.values(WorkItemStatus).map((status) => (
          <WorkItemColumn
            key={status}
            title={statusToTitle(status)}
            workItems={workItemsByStatus[status]}
            onDropWorkItem={(item) => handleDropWorkItem(item, status)}
          />
        ))}
      </Grid>
    </DndProvider>
  );
};

export default WorkItemBoard;
