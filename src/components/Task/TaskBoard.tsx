import { Center, Grid, Text } from "@mantine/core";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { Task, TaskStatus } from "@prisma/client";
import { DndProvider } from "react-dnd";
import { notifications } from "@mantine/notifications";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useMediaQuery } from "@mantine/hooks";
import { getSingleQueryParam } from "../../utils/getSingleQueryParam";
import {
  useGetTasksForProjectQuery,
  useUpdateStatusMutation,
} from "../../store/api/taskApi";
import Loading from "../Loader/Loader";
import TaskColumn from "./TaskColumn";

const TaskBoard = () => {
  const router = useRouter();
  const projectId = getSingleQueryParam(router.query.projectId);
  const { data, isLoading } = useGetTasksForProjectQuery(projectId ?? "");
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [updateStatus] = useUpdateStatusMutation();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

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
      <Center className="secondary">
        <Text size="lg">No tasks yet, create one to get started!</Text>
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
    <DndProvider backend={isSmallScreen ? TouchBackend : HTML5Backend}>
      <Grid gutter="lg">
        <TaskColumn
          title="To Do"
          tasks={todoTasks}
          onDropTask={handleDropTask}
        />
        <TaskColumn
          title="In Progress"
          tasks={inProgressTasks}
          onDropTask={handleDropTask}
        />
        <TaskColumn
          title="Done"
          tasks={doneTasks}
          onDropTask={handleDropTask}
        />
      </Grid>
    </DndProvider>
  );
};

export default TaskBoard;
