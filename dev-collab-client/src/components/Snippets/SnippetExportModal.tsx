import BaseButton from "../shared/base/BaseButton";
import { Group, Modal, Text, TextInput } from "@mantine/core";

interface SnippetExportModalProps {
  opened: boolean;
  onClose: () => void;
  fileName: string;
  onFileNameChange: (value: string) => void;
  fileNameError: string;
  isSuggesting: boolean;
  isCreating: boolean;
  onConfirm: () => void;
}

const SnippetExportModal = ({
  opened,
  onClose,
  fileName,
  onFileNameChange,
  fileNameError,
  isSuggesting,
  isCreating,
  onConfirm,
}: SnippetExportModalProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Export code block as snippet"
      centered
    >
      <TextInput
        label="Filename"
        value={fileName}
        onChange={(event) => onFileNameChange(event.currentTarget.value)}
        placeholder="e.g., auth_service.ts"
        error={fileNameError}
        data-autofocus
        disabled={isSuggesting}
      />
      <Text fz="sm" c="dimmed" mt="xs">
        {isSuggesting
          ? "Getting AI filename suggestion..."
          : "Prefilled with an AI-suggested name from the API."}
      </Text>

      <Group justify="flex-end" mt="md">
        <BaseButton variant="outline" onClick={onClose}>
          Cancel
        </BaseButton>
        <BaseButton
          onClick={onConfirm}
          loading={isCreating}
          disabled={!fileName.trim() || !!fileNameError}
        >
          Save Snippet
        </BaseButton>
      </Group>
    </Modal>
  );
};

export default SnippetExportModal;
