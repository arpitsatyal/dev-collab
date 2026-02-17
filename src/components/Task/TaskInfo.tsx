import { Button, Group, Text } from "@mantine/core";
import React from "react";
import { ProjectWithPin } from "../../types";

const TaskInfo = ({
  project,
  open,
}: {
  project: ProjectWithPin;
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
      <Button onClick={open}>Create Work Item</Button>
    </Group>
  );
};

export default TaskInfo;
