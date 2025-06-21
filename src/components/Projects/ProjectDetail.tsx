import { Container, Paper, Stack, Text } from "@mantine/core";
import React from "react";
import classes from "./Project.module.css";
import { ProjectWithPin } from "../../types";

const ProjectDetail = ({ project }: { project: ProjectWithPin }) => {
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
            {project?.title}
          </Text>
          {project?.description ? (
            <Text size="md" className={classes.description}>
              {project.description}
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

export default ProjectDetail;
