import { notifications } from "@mantine/notifications";
import { useUpdatePinnedStatusMutation } from "../../store/api/workspaceApi";
import { WorkspaceWithPin } from "../../types";

interface UseSideNavMutationsProps {
  setOpenItem: React.Dispatch<React.SetStateAction<string | null>>;
  setPendingScrollId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useSideNavMutations = ({
  setOpenItem,
  setPendingScrollId,
}: UseSideNavMutationsProps) => {
  const [updatePinnedStatus] = useUpdatePinnedStatusMutation();

  const handleUpdatePinnedStatus = async (workspace: WorkspaceWithPin) => {
    try {
      setOpenItem((prev) => (prev === workspace.id ? null : workspace.id));

      await updatePinnedStatus({
        workspaceId: workspace.id,
        isPinned: !workspace.isPinned,
      }).unwrap();

      setPendingScrollId(workspace.id);

      notifications.show({
        title: "Job done!",
        message: `Workspace ${!workspace.isPinned ? "Pinned" : "Unpinned"} Successfully! 🌟`,
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update pinned status. Please try again.",
        color: "red",
      });
    }
  };

  return { handleUpdatePinnedStatus };
};
