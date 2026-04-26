import { Modal, Stack, Textarea, Button } from "@mantine/core";

interface CreateMissionModalProps {
  opened: boolean;
  onClose: () => void;
  missionGoal: string;
  setMissionGoal: (goal: string) => void;
  onStartMission: () => void;
  isCreating: boolean;
}

export const CreateMissionModal = ({
  opened,
  onClose,
  missionGoal,
  setMissionGoal,
  onStartMission,
  isCreating,
}: CreateMissionModalProps) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Initiate New Agent Mission" radius="md">
      <Stack>
        <Textarea
          label="What is the mission goal?"
          placeholder="e.g. Refactor the authentication snippets and improve documentation"
          value={missionGoal}
          onChange={(e) => setMissionGoal(e.currentTarget.value)}
          required
          data-autofocus
          minRows={4}
          size="md"
        />
        <Button
          onClick={onStartMission}
          loading={isCreating}
          fullWidth
          radius="md"
          size="md"
        >
          Launch Mission
        </Button>
      </Stack>
    </Modal>
  );
};
