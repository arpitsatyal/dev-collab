import { Group, Input, MultiSelect } from "@mantine/core";
import BaseModal from "../shared/base/BaseModal";
import BaseButton from "../shared/base/BaseButton";
import BaseInput from "../shared/base/BaseInput";
import BaseSelect from "../shared/base/BaseSelect";
import BaseTextarea from "../shared/base/BaseTextarea";
import { DatePicker } from "@mantine/dates";
import { useState, useMemo } from "react";
import { notifications } from "@mantine/notifications";
import { WorkItemStatus, WorkItemCreateData } from "../../types";
import dayjs from "dayjs";
import { useGetUsersQuery } from "../../store/api/userApi";
import { snippetApi } from "../../store/api/snippetApi";
import { IconCode } from "@tabler/icons-react";

interface CreateWorkItemModalProps {
  handleInputChange: <K extends keyof WorkItemCreateData>(
    field: K,
    value: WorkItemCreateData[K],
  ) => void;
  handleSubmit: () => void;
  opened: boolean;
  close: () => void;
  workItemForm: WorkItemCreateData;
  isLoading: boolean;
  workspaceTitle: string;
}

const CreateWorkItemModal = ({
  opened,
  handleInputChange,
  handleSubmit,
  close,
  workItemForm,
  isLoading,
  workspaceTitle,
}: CreateWorkItemModalProps) => {
  const { data: users = [] } = useGetUsersQuery();
  const [errors, setErrors] = useState<{
    title?: string;
    workspaceId?: string;
    status?: string;
  }>({});

  const { data: workspaceSnippets = [] } = snippetApi.useGetSnippetsQuery(
    { workspaceId: workItemForm.workspaceId },
    { skip: !workItemForm.workspaceId },
  );

  const snippetData = useMemo(() => {
    return workspaceSnippets.map((s) => ({
      value: s.id,
      label: s.title,
    }));
  }, [workspaceSnippets]);

  const validateForm = () => {
    const newErrors: { title?: string; workspaceId?: string; status?: string } =
      {};
    if (!workItemForm.title.trim()) newErrors.title = "Title is required";
    if (!workItemForm.workspaceId)
      newErrors.workspaceId = "Workspace is required";
    if (!workItemForm.status) newErrors.status = "Status is required";
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
    <BaseModal
      opened={opened}
      onClose={close}
      title="Create New Work Item"
      size="lg"
    >
      <BaseInput
        label="Work Item Title"
        placeholder="Enter work item title"
        value={workItemForm.title ?? ""}
        onChange={(e) => handleInputChange("title", e.currentTarget.value)}
        mb="md"
        required
        error={errors.title}
      />
      <BaseTextarea
        label="Description"
        placeholder="Enter work item description"
        value={workItemForm.description ?? ""}
        onChange={(e) =>
          handleInputChange("description", e.currentTarget.value)
        }
        mb="md"
      />
      <BaseSelect
        label="Status"
        placeholder="Select status"
        data={Object.values(WorkItemStatus)}
        value={workItemForm.status}
        onChange={(value) =>
          handleInputChange(
            "status",
            (value as WorkItemStatus) ?? WorkItemStatus.TODO,
          )
        }
        mb="md"
        required
        error={errors.status}
      />
      <BaseSelect
        label="Assigned To"
        placeholder="Select assignee"
        data={
          users.map((user) => ({
            value: user.id,
            label: user.name ?? "",
          })) ?? []
        }
        value={workItemForm.assignedToId}
        onChange={(value) => handleInputChange("assignedToId", value ?? "")}
        mb="md"
        clearable
      />
      <MultiSelect
        label="Attach Context (Snippets)"
        placeholder="Select relevant code snippets"
        data={snippetData}
        value={workItemForm.snippetIds || []}
        onChange={(values) => handleInputChange("snippetIds", values)}
        leftSection={<IconCode size={16} />}
        mb="md"
        searchable
        clearable
      />
      <Input.Wrapper label="Due Date" mb="md">
        <DatePicker
          value={workItemForm.dueDate}
          onChange={(date) => handleInputChange("dueDate", date)}
          allowDeselect
          minDate={dayjs().startOf("day").toDate()}
        />
      </Input.Wrapper>
      <BaseSelect
        label="Workspace"
        placeholder={workspaceTitle}
        disabled
        value={workItemForm.workspaceId}
        mb="md"
        required
        error={errors.workspaceId}
      />
      <Group justify="right">
        <BaseButton variant="outline" onClick={close} className="cancelButton">
          Cancel
        </BaseButton>
        <BaseButton onClick={onSubmit} loading={isLoading}>
          Create Work Item
        </BaseButton>
      </Group>
    </BaseModal>
  );
};

export default CreateWorkItemModal;
