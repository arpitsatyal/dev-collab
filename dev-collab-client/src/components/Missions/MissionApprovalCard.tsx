import { Box, Divider, Alert, Group, Button } from "@mantine/core";
import { IconAlertCircleFilled } from "@tabler/icons-react";

interface MissionApprovalCardProps {
  isVisible: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

const MissionApprovalCard = ({ isVisible, onApprove, onReject }: MissionApprovalCardProps) => {
  if (!isVisible) return null;

  return (
    <Box mt="xl">
      <Divider mb="md" label="Action Required" labelPosition="center" color="orange" />
      <Alert icon={<IconAlertCircleFilled size={16} />} title="Agent Requesting Approval" color="orange" radius="md">
        The agent needs permission to perform a sensitive action.
        <Group mt="md">
          <Button color="orange" size="xs" radius="md" onClick={onApprove}>Approve Step</Button>
          <Button variant="subtle" color="gray" size="xs" radius="md" onClick={onReject}>Reject</Button>
        </Group>
      </Alert>
    </Box>
  );
};

export default MissionApprovalCard;
