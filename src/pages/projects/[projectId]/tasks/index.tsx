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
import { notifications } from "@mantine/notifications";
import { useAppSelector } from "../../../../store/hooks";
import { getSingleQueryParam } from "../../../../utils/getSingleQueryParam";
import { useRouter } from "next/router";
import { TaskCreateData } from "../../../api/tasks";

const TasksPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const router = useRouter();
  const projectId = getSingleQueryParam(router.query.projectId);
  const projects = useAppSelector((state) => state.project.loadedProjects);
  const project = projects.find((project) => project.id === projectId);

  const [taskForm, setTaskForm] = useState<TaskCreateData>({
    title: "",
    description: null,
    status: TaskStatus.TODO,
    assignedToId: null,
    dueDate: null,
    projectId: projectId ?? "",
  });

  const handleInputChange = <K extends keyof TaskCreateData>(
    field: K,
    value: TaskCreateData[K]
  ) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setTaskForm({
        title: "",
        description: null,
        status: TaskStatus.TODO,
        assignedToId: null,
        dueDate: null,
        projectId: "",
      });

      await createTask({
        task: taskForm,
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
          c="dimmed"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordWrap: "break-word",
            whiteSpace: "normal",
          }}
        >
          Project Workspace {project?.title}
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
