import { Button, Group, Text } from "@mantine/core";
import { Project } from "@prisma/client";
import React from "react";
import classes from "./Task.module.css";

const TaskInfo = ({
  project,
  open,
}: {
  project: Project;
  open: () => void;
}) => {
  return (
    <Group justify="space-between" mb="lg">
      <Text
        size="xl"
        fw={600}
        mb="sm"
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          wordWrap: "break-word",
          whiteSpace: "normal",
        }}
        className="title"
      >
        Project Workspace {project?.title}
      </Text>
      <Button onClick={open}>Create Task</Button>
    </Group>
  );
};

export default TaskInfo;
