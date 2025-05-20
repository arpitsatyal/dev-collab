import { Center, Grid, Paper, Text, useMantineTheme } from "@mantine/core";
import { useRouter } from "next/router";
import React from "react";
import { getSingleQueryParam } from "../utils/getSingleQueryParam";
import { useGetTasksForProjectQuery } from "../store/api/taskApi";
import Loading from "./Loader";
import { Task, TaskStatus } from "@prisma/client";

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  theme: ReturnType<typeof useMantineTheme>;
}

const TaskColumn = ({ title, tasks, theme }: TaskColumnProps) => (
  <Grid.Col span={{ base: 12, md: 4 }}>
    <Paper p="md" shadow="xs" style={{ backgroundColor: theme.colors.gray[0] }}>
      <Text fw={500} size="lg" mb="md">
        {title}
      </Text>
      {tasks.length === 0 ? (
        <Text c="dimmed" size="sm">
          No tasks in this column
        </Text>
      ) : (
        tasks.map((task) => (
          <Paper
            key={task.id}
            p="sm"
            mb="sm"
            style={{ backgroundColor: "#ffffff" }}
          >
            <Text>{task.title}</Text>
            {/* Placeholder for DnD tasks */}
            <Text size="xs" c="dimmed">
              Task placeholder (DnD area)
            </Text>
          </Paper>
        ))
      )}
    </Paper>
  </Grid.Col>
);

const TaskBoard = () => {
  const theme = useMantineTheme();
  const router = useRouter();
  const projectId = getSingleQueryParam(router.query.projectId);

  if (!projectId) return <Loading />;
  const { data, isLoading } = useGetTasksForProjectQuery(projectId);

  if (isLoading) return <Loading />;

  if (!data || data.length === 0) {
    return (
      <Center>
        <Text c="dimmed" size="lg">
          No tasks yet, create one to get started!
        </Text>
      </Center>
    );
  }

  const todoTasks = data.filter((task) => task.status === TaskStatus.TODO);
  const inProgressTasks = data.filter(
    (task) => task.status === TaskStatus.IN_PROGRESS
  );
  const doneTasks = data.filter((task) => task.status === TaskStatus.DONE);

  return (
    <Grid gutter="lg">
      <TaskColumn title="To Do" tasks={todoTasks} theme={theme} />
      <TaskColumn title="In Progress" tasks={inProgressTasks} theme={theme} />
      <TaskColumn title="Done" tasks={doneTasks} theme={theme} />
    </Grid>
  );
};

export default TaskBoard;
