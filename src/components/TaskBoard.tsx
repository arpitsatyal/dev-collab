import { Center, Grid, Text, useMantineTheme } from "@mantine/core";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { getSingleQueryParam } from "../utils/getSingleQueryParam";
import {
  useGetTasksForProjectQuery,
  useUpdateStatusMutation,
} from "../store/api/taskApi";
import Loading from "./Loader";
import { Task, TaskStatus } from "@prisma/client";
import TaskColumn from "./TaskColumn";
import { DndProvider } from "react-dnd";
import { notifications } from "@mantine/notifications";
import { TouchBackend } from "react-dnd-touch-backend";

const TaskBoard = () => {
  const theme = useMantineTheme();
  const router = useRouter();
  const projectId = getSingleQueryParam(router.query.projectId);
  const { data, isLoading } = useGetTasksForProjectQuery(projectId ?? "");
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [updateStatus] = useUpdateStatusMutation();

  const todoTasks = useMemo(
    () => localTasks.filter((task) => task.status === TaskStatus.TODO),
    [localTasks]
  );
  const inProgressTasks = useMemo(
    () => localTasks.filter((task) => task.status === TaskStatus.IN_PROGRESS),
    [localTasks]
  );
  const doneTasks = useMemo(
    () => localTasks.filter((task) => task.status === TaskStatus.DONE),
    [localTasks]
  );

  useEffect(() => {
    setLocalTasks(data ?? []);
  }, [data]);

  if (!projectId || isLoading) return <Loading />;

  if (data?.length === 0) {
    return (
      <Center>
        <Text c="dimmed" size="lg">
          No tasks yet, create one to get started!
        </Text>
      </Center>
    );
  }

  const handleDropTask = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    const previousTasks = [...localTasks];
    setLocalTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      await updateStatus({
        projectId,
        taskId,
        newStatus,
      }).unwrap();
      notifications.show({
        title: "Job done!",
        message: "Task updated successfully! 🌟",
      });
    } catch (error) {
      // Revert on failure
      setLocalTasks(previousTasks);
      notifications.show({
        title: "Error",
        message: "Failed to update task status. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <DndProvider backend={TouchBackend}>
      <Grid gutter="lg">
        <TaskColumn
          title="To Do"
          tasks={todoTasks}
          theme={theme}
          onDropTask={handleDropTask}
        />
        <TaskColumn
          title="In Progress"
          tasks={inProgressTasks}
          theme={theme}
          onDropTask={handleDropTask}
        />
        <TaskColumn
          title="Done"
          tasks={doneTasks}
          theme={theme}
          onDropTask={handleDropTask}
        />
      </Grid>
    </DndProvider>
  );
};

export default TaskBoard;
