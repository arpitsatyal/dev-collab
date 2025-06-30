import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { DocCreateData } from "../../pages/api/docs";

interface CreateDocModalProps {
  handleInputChange: <K extends keyof DocCreateData>(
    field: K,
    value: DocCreateData[K]
  ) => void;
  handleSubmit: () => void;
  opened: boolean;
  close: () => void;
  docForm: DocCreateData;
  isLoading: boolean;
}

const CreateDocModal = ({
  opened,
  handleInputChange,
  handleSubmit,
  close,
  docForm,
  isLoading,
}: CreateDocModalProps) => {
  const [errors, setErrors] = useState<{ label?: string }>({});

  const validateForm = () => {
    const newErrors: { label?: string; projectId?: string } = {};
    if (!docForm.label?.trim()) newErrors.label = "Label is required";
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
    <Modal
      opened={opened}
      onClose={close}
      title="Create New Doc"
      size="lg"
      centered
    >
      <TextInput
        label="Doc Title"
        placeholder="Enter doc title"
        value={docForm.label ?? ""}
        onChange={(e) => handleInputChange("label", e.currentTarget.value)}
        mb="md"
        required
        error={errors.label}
        styles={{
          label: {
            padding: 5,
          },
        }}
      />
      <Group justify="right">
        <Button variant="outline" onClick={close} className="cancelButton">
          Cancel
        </Button>
        <Button onClick={onSubmit} loading={isLoading}>
          Create Doc
        </Button>
      </Group>
    </Modal>
  );
};

export default CreateDocModal;
