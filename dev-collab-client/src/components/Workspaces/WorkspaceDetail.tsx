import { Container, Paper, Stack, Text } from "@mantine/core";
import React from "react";
import classes from "./Workspace.module.css";
import { WorkspaceWithPin } from "../../types";

const WorkspaceDetail = ({ workspace }: { workspace: WorkspaceWithPin }) => {
  return (
    <Container size="md" p={{ base: "sm", sm: "md" }}>
      <Paper
        shadow="sm"
        p={{ base: "md", sm: "lg" }}
        radius="md"
        withBorder
        className={classes.root}
      >
        <Stack gap="md">
          <Text size="lg" fw={600} className="title">
            {workspace?.title}
          </Text>
          {workspace?.description ? (
            <Text size="md" className={classes.description}>
              {workspace.description}
            </Text>
          ) : (
            <Text size="md" fs="italic" className={classes.noDescription}>
              No description available
            </Text>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default WorkspaceDetail;
