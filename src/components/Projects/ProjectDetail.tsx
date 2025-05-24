import { Container, Paper, Stack, Text } from "@mantine/core";
import { Project } from "@prisma/client";
import React from "react";
import classes from "./Project.module.css";

const ProjectDetail = ({ project }: { project: Project }) => {
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
          <Text size="lg" fw={600} className={classes.title}>
            {project?.title}
          </Text>
          {project?.description ? (
            <Text size="md">{project.description}</Text>
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
