"use client";

import { useState } from "react";
import { Button, Group, Container, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { withAuth } from "../../../../guards/withAuth";
import Layout from "../../../../components/Layout";
import CreateTaskModal from "../../../../components/CreateTaskModal";
import TaskBoard from "../../../../components/TaskBoard";

const TasksPage = () => {
  const [opened, { open, close }] = useDisclosure(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignee: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Task submitted:", taskForm);
    setTaskForm({ title: "", description: "", assignee: "" });
    close();
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
