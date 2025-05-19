import {
  Button,
  Group,
  Input,
  Modal,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { TaskForm } from "../pages/projects/[projectId]/tasks";
import { useGetProjectsQuery } from "../store/api/projectApi";
import { useGetUsersQuery } from "../store/api/userApi";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { TaskStatus } from "@prisma/client";

interface CreateTaskModalProps {
  handleInputChange: <K extends keyof TaskForm>(
    field: K,
    value: TaskForm[K]
  ) => void;
  handleSubmit: () => void;
  opened: boolean;
  close: () => void;
  taskForm: TaskForm;
  isLoading: boolean;
}

const CreateTaskModal = ({
  opened,
  handleInputChange,
  handleSubmit,
  close,
  taskForm,
  isLoading,
}: CreateTaskModalProps) => {
  const { data: projects = [] } = useGetProjectsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [errors, setErrors] = useState<{
    title?: string;
    projectId?: string;
    status?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { title?: string; projectId?: string; status?: string } =
      {};
    if (!taskForm.title.trim()) newErrors.title = "Title is required";
    if (!taskForm.projectId) newErrors.projectId = "Project is required";
    if (!taskForm.status) newErrors.status = "Status is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (validateForm()) {
      handleSubmit();
    } else {
      notifications.show({
        title: "Validation Error",
        message: "Please fill in all required fields.",
        color: "red",
      });
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Create New Task" size="lg">
      <TextInput
        label="Task Title"
        placeholder="Enter task title"
        value={taskForm.title ?? ""}
        onChange={(e) => handleInputChange("title", e.currentTarget.value)}
        mb="md"
        required
        error={errors.title}
      />
      <Textarea
        label="Description"
        placeholder="Enter task description"
        value={taskForm.description ?? ""}
        onChange={(e) =>
          handleInputChange("description", e.currentTarget.value)
        }
        mb="md"
      />
      <Select
        label="Status"
        placeholder="Select status"
        data={Object.values(TaskStatus)}
        value={taskForm.status}
        onChange={(value) =>
          handleInputChange("status", (value as TaskStatus) ?? TaskStatus.TODO)
        }
        mb="md"
        required
        error={errors.status}
      />
      <Select
        label="Assigned To"
        placeholder="Select assignee"
        data={
          users.map((user) => ({
            value: user.id,
            label: user.name ?? "",
          })) ?? []
        }
        value={taskForm.assignedToId}
        onChange={(value) => handleInputChange("assignedToId", value ?? "")}
        mb="md"
        clearable
      />
      <Input.Wrapper label="Due Date" mb="md">
        <DatePicker
          value={taskForm.dueDate}
          onChange={(date) => handleInputChange("dueDate", date)}
          allowDeselect
        />
      </Input.Wrapper>
      <Select
        label="Project"
        placeholder="Select project"
        data={
          projects?.map((project) => ({
            value: project.id,
            label: project.title,
          })) ?? []
        }
        value={taskForm.projectId}
        onChange={(value) => handleInputChange("projectId", value || "")}
        mb="md"
        required
        error={errors.projectId}
      />
      <Group justify="right">
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button onClick={onSubmit} loading={isLoading}>
          Create Task
        </Button>
      </Group>
    </Modal>
  );
};

export default CreateTaskModal;
