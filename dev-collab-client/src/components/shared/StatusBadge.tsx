import { Badge } from "@mantine/core";
import { WorkItemStatus } from "../../types";

interface StatusBadgeProps {
  status: WorkItemStatus;
}

const statusConfig: Record<WorkItemStatus, { color: string; label: string }> = {
  [WorkItemStatus.TODO]: { color: "gray", label: "To Do" },
  [WorkItemStatus.IN_PROGRESS]: { color: "blue", label: "In Progress" },
  [WorkItemStatus.DONE]: { color: "green", label: "Done" } };

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Badge color={config.color} variant="light" radius="sm">
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
