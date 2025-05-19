import { Grid, Paper, Text, useMantineTheme } from "@mantine/core";
import React from "react";

const TaskBoard = () => {
  const theme = useMantineTheme();

  return (
    <Grid gutter="lg">
      {/* To Do Column */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper
          p="md"
          shadow="xs"
          style={{ backgroundColor: theme.colors.gray[0] }}
        >
          <Text fw={500} size="lg" mb="md">
            To Do
          </Text>
          {/* Placeholder for DnD tasks */}
          <Paper p="sm" mb="sm" style={{ backgroundColor: "#ffffff" }}>
            <Text>Task placeholder (DnD area)</Text>
          </Paper>
        </Paper>
      </Grid.Col>

      {/* In Progress Column */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper
          p="md"
          shadow="xs"
          style={{ backgroundColor: theme.colors.gray[0] }}
        >
          <Text fw={500} size="lg" mb="md">
            In Progress
          </Text>
          {/* Placeholder for DnD tasks */}
          <Paper p="sm" mb="sm" style={{ backgroundColor: "#ffffff" }}>
            <Text>Task placeholder (DnD area)</Text>
          </Paper>
        </Paper>
      </Grid.Col>

      {/* Done Column */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper
          p="md"
          shadow="xs"
          style={{ backgroundColor: theme.colors.gray[0] }}
        >
          <Text fw={500} size="lg" mb="md">
            Done
          </Text>
          {/* Placeholder for DnD tasks */}
          <Paper p="sm" mb="sm" style={{ backgroundColor: "#ffffff" }}>
            <Text>Task placeholder (DnD area)</Text>
          </Paper>
        </Paper>
      </Grid.Col>
    </Grid>
  );
};

export default TaskBoard;
