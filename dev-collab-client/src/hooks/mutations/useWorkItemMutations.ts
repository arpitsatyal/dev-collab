import { useCallback } from "react";
import { WorkItem, WorkItemStatus } from "../../types";
import { notifications } from "@mantine/notifications";
import { useUpdateStatusMutation } from "../../store/api/workItemApi";

interface UseWorkItemMutationsProps {
  workspaceId: string | null;
  localWorkItems: WorkItem[];
  setLocalWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
}

export const useWorkItemMutations = ({
  workspaceId,
  localWorkItems,
  setLocalWorkItems,
}: UseWorkItemMutationsProps) => {
  const [updateStatus] = useUpdateStatusMutation();

  const handleDropWorkItem = useCallback(
    async (workItemId: string, newStatus: WorkItemStatus) => {
      if (!workspaceId) return;

      // Optimistic update
      const previousWorkItems = [...localWorkItems];
      setLocalWorkItems((prev) =>
        prev.map((workItem) =>
          workItem.id === workItemId
            ? { ...workItem, status: newStatus }
            : workItem,
        ),
      );

      try {
        await updateStatus({
          workspaceId,
          workItemId,
          newStatus,
        }).unwrap();
        notifications.show({
          title: "Job done!",
          message: "Work Item updated successfully! 🌟",
        });
      } catch (error) {
        // Revert on failure
        setLocalWorkItems(previousWorkItems);
        notifications.show({
          title: "Error",
          message: "Failed to update work item status. Please try again.",
          color: "red",
        });
      }
    },
    [localWorkItems, setLocalWorkItems, updateStatus, workspaceId],
  );

  return { handleDropWorkItem };
};
