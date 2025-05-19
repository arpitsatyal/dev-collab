import { Button, Group, Modal, Textarea, TextInput } from "@mantine/core";

interface CreateTaskModalProps {
  handleInputChange: (key: string, val: string) => void;
  handleSubmit: () => void;
  opened: boolean;
  close: () => void;
  taskForm: Record<string, string>;
}

const CreateTaskModal = ({
  opened,
  handleInputChange,
  handleSubmit,
  close,
  taskForm,
}: CreateTaskModalProps) => {
  return (
    <>
      <Modal opened={opened} onClose={close} title="Create New Task" size="lg">
        <TextInput
          label="Task Title"
          placeholder="Enter task title"
          value={taskForm.title}
          onChange={(e) => handleInputChange("title", e.currentTarget.value)}
          mb="md"
          required
        />
        <Textarea
          label="Description"
          placeholder="Enter task description"
          value={taskForm.description}
          onChange={(e) =>
            handleInputChange("description", e.currentTarget.value)
          }
          mb="md"
        />
        <TextInput
          label="Assignee"
          placeholder="Enter assignee name"
          value={taskForm.assignee}
          onChange={(e) => handleInputChange("assignee", e.currentTarget.value)}
          mb="md"
        />
        <Group justify="right">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Task</Button>
        </Group>
      </Modal>
    </>
  );
};

export default CreateTaskModal;
