import { Button, Group, Text } from "@mantine/core";
import React from "react";
import { WorkspaceWithPin } from "../../types";

const WorkItemInfo = ({
  workspace,
  open,
}: {
  workspace: WorkspaceWithPin;
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
        Workspace Workspace [{workspace?.title}]
      </Text>
      <Button onClick={open}>Create Work Item</Button>
    </Group>
  );
};

export default WorkItemInfo;
