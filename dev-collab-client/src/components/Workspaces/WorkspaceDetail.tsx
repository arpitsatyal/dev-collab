import { Container, Paper } from "@mantine/core";
import React from "react";
import classes from "./Workspace.module.css";
import { WorkspaceWithPin } from "../../types";
import Section from "../shared/Section";

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
        <Section
          title={workspace?.title}
          description={workspace?.description || "No description available"}
        >
          <div />
        </Section>
      </Paper>
    </Container>
  );
};

export default WorkspaceDetail;
