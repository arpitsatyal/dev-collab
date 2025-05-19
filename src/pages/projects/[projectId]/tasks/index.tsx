"use client";

import { useState } from "react";
import { Button, Group, Container, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { withAuth } from "../../../../guards/withAuth";
import Layout from "../../../../components/Layout";
import CreateTaskModal from "../../../../components/CreateTaskModal";
import TaskBoard from "../../../../components/TaskBoard";
import { TaskStatus } from "@prisma/client";
import { useCreateTaskMutation } from "../../../../store/api/taskApi";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";

export interface TaskForm {
  title: string;
  description: string | undefined;
  status: TaskStatus;
  assignedToId: string | undefined;
  dueDate: string | null;
  projectId: string;
}

const TasksPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    description: undefined,
    status: TaskStatus.TODO,
    assignedToId: undefined,
    dueDate: null,
    projectId: "",
  });

  const handleInputChange = <K extends keyof TaskForm>(
    field: K,
    value: TaskForm[K]
  ) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setTaskForm({
        title: "",
        description: undefined,
        status: TaskStatus.TODO,
        assignedToId: undefined,
        dueDate: null,
        projectId: "",
      });

      await createTask({
        task: {
          ...taskForm,
          dueDate: taskForm.dueDate ? dayjs(taskForm.dueDate).toDate() : null,
        },
        projectId: taskForm.projectId,
      }).unwrap();
      notifications.show({
        title: "Job done!",
        message: "Task created successfully! 🌟",
      });
      close();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Whooops",
        message: "Task could be created.",
      });
    }
  };

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <Text
          size="xl"
          fw={600}
          mb="sm"
          c="dark"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordWrap: "break-word",
            whiteSpace: "normal",
          }}
        >
          Project Workspace
        </Text>
        <Button onClick={open}>Create Task</Button>
      </Group>

      <CreateTaskModal
        opened={opened}
        close={close}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        taskForm={taskForm}
        isLoading={isLoading}
      />

      <TaskBoard />
    </Container>
  );
};

TasksPage.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default TasksPage;
