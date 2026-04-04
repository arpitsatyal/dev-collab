import { Grid } from "@mantine/core";
import React from "react";
import { DndProvider } from "react-dnd";
import Loading from "../Loader/Loader";
import WorkItemColumn from "./WorkItemColumn";
import BoardEmptyState from "./BoardEmptyState";
import { useWorkItemBoard } from "../../hooks/useWorkItemBoard";

const WorkItemBoard = () => {
  const {
    workspaceId,
    isLoading,
    data,
    todoWorkItems,
    inProgressWorkItems,
    doneWorkItems,
    handleDropWorkItem,
    dndBackend,
  } = useWorkItemBoard();

  if (!workspaceId || isLoading) return <Loading />;

  if (data?.length === 0) {
    return <BoardEmptyState />;
  }

  return (
    <DndProvider backend={dndBackend}>
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
