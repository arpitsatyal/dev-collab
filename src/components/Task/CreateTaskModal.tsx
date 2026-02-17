import {
  Button,
  Group,
  Input,
  Modal,
  Select,
  Textarea,
  TextInput,
  MultiSelect,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useState, useMemo } from "react";
import { notifications } from "@mantine/notifications";
import { TaskStatus } from "@prisma/client";
import dayjs from "dayjs";
import { TaskCreateData } from "../../pages/api/tasks";
import { useGetUsersQuery } from "../../store/api/userApi";
import { snippetApi } from "../../store/api/snippetApi";
import { IconCode } from "@tabler/icons-react";

interface CreateTaskModalProps {
  handleInputChange: <K extends keyof TaskCreateData>(
    field: K,
    value: TaskCreateData[K]
  ) => void;
  handleSubmit: () => void;
  opened: boolean;
  close: () => void;
  taskForm: TaskCreateData;
  isLoading: boolean;
  projectTitle: string;
}

const CreateTaskModal = ({
  opened,
  handleInputChange,
  handleSubmit,
  close,
  taskForm,
  isLoading,
  projectTitle,
}: CreateTaskModalProps) => {
  const { data: users = [] } = useGetUsersQuery();
  const [errors, setErrors] = useState<{
    title?: string;
    projectId?: string;
    status?: string;
  }>({});

  const { data: projectSnippets = [] } = snippetApi.useGetSnippetsQuery(
    { projectId: taskForm.projectId },
    { skip: !taskForm.projectId }
  );

  const snippetData = useMemo(() => {
    return projectSnippets.map((s) => ({
      value: s.id,
      label: s.title,
    }));
  }, [projectSnippets]);

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
    <Modal opened={opened} onClose={close} title="Create New Work Item" size="lg">
      <TextInput
        label="Work Item Title"
        placeholder="Enter work item title"
        value={taskForm.title ?? ""}
        onChange={(e) => handleInputChange("title", e.currentTarget.value)}
        mb="md"
        required
        error={errors.title}
      />
      <Textarea
        label="Description"
        placeholder="Enter work item description"
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
      <MultiSelect
        label="Attach Context (Snippets)"
        placeholder="Select relevant code snippets"
        data={snippetData}
        value={taskForm.snippetIds || []}
        onChange={(values) => handleInputChange("snippetIds", values)}
        leftSection={<IconCode size={16} />}
        mb="md"
        searchable
        clearable
      />
      <Input.Wrapper label="Due Date" mb="md">
        <DatePicker
          value={taskForm.dueDate}
          onChange={(date) => handleInputChange("dueDate", date)}
          allowDeselect
          minDate={dayjs().startOf("day").toDate()}
        />
      </Input.Wrapper>
      <Select
        label="Workspace"
        placeholder={projectTitle}
        disabled
        value={taskForm.projectId}
        mb="md"
        required
        error={errors.projectId}
      />
      <Group justify="right">
        <Button variant="outline" onClick={close} className="cancelButton">
          Cancel
        </Button>
        <Button onClick={onSubmit} loading={isLoading}>
          Create Work Item
        </Button>
      </Group>
    </Modal>
  );
};

export default CreateTaskModal;
