import { Box, Divider, Alert, Group, Button } from "@mantine/core";
import { IconAlertCircleFilled } from "@tabler/icons-react";

interface MissionApprovalCardProps {
  isVisible: boolean;
  message?: string;
  onApprove?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}

const MissionApprovalCard = ({ isVisible, message, onApprove, onReject, isLoading }: MissionApprovalCardProps) => {
  if (!isVisible) return null;

  return (
    <Box mt="xl">
      <Divider mb="md" label="Action Required" labelPosition="center" color="orange" />
      <Alert icon={<IconAlertCircleFilled size={16} />} title="Agent Needs Attention" color="orange" radius="md">
        {message || "The agent is waiting for your input to proceed."}
        <Group mt="md">
          <Button color="orange" size="xs" radius="md" onClick={onApprove} loading={isLoading} disabled={isLoading}>Proceed</Button>
          <Button variant="subtle" color="gray" size="xs" radius="md" onClick={onReject} disabled={isLoading}>Reject</Button>
        </Group>
      </Alert>
    </Box>
  );
};

export default MissionApprovalCard;
