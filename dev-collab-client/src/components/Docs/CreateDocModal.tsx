import { Group } from "@mantine/core";
import BaseModal from "../shared/base/BaseModal";
import BaseButton from "../shared/base/BaseButton";
import BaseInput from "../shared/base/BaseInput";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { DocCreateData } from "../../types";
import { useDocMutations } from "../../hooks/mutations/useDocMutations";
import { useRouter } from "next/router";
import { getSingleQueryParam } from "../../utils/navigation/queryParams";

interface CreateDocModalProps {
  opened: boolean;
  close: () => void;
}

const CreateDocModal = ({ opened, close }: CreateDocModalProps) => {
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId) ?? "";
  const { isLoading, handleCreateDoc } = useDocMutations();

  const [docForm, setDocForm] = useState<DocCreateData>({
    label: "",
    workspaceId: workspaceId,
    roomId: "",
  });

  const [errors, setErrors] = useState<{ label?: string }>({});

  useEffect(() => {
    if (opened) {
      setDocForm({
        label: "",
        workspaceId,
        roomId: "",
      });
      setErrors({});
    }
  }, [opened, workspaceId]);

  const handleInputChange = (value: string) => {
    setDocForm((prev) => ({ ...prev, label: value }));
  };

  const validateForm = () => {
    const newErrors: { label?: string } = {};
    if (!docForm.label?.trim()) newErrors.label = "Label is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) {
      notifications.show({
        title: "Validation Error",
        message: "Please fill in all required fields.",
        color: "red",
      });
      return;
    }

    try {
      await handleCreateDoc(docForm);
      close();
    } catch (error) {
      // Error handled inside hook (toasts)
    }
  };

  return (
    <BaseModal opened={opened} onClose={close} title="Create New Doc" size="lg">
      <BaseInput
        label="Doc Title"
        placeholder="Enter doc title"
        value={docForm.label ?? ""}
        onChange={(e) => handleInputChange(e.currentTarget.value)}
        mb="md"
        required
        error={errors.label}
      />
      <Group justify="right">
        <BaseButton variant="outline" onClick={close} className="cancelButton">
          Cancel
        </BaseButton>
        <BaseButton onClick={onSubmit} loading={isLoading}>
          Create Doc
        </BaseButton>
      </Group>
    </BaseModal>
  );
};

export default CreateDocModal;
