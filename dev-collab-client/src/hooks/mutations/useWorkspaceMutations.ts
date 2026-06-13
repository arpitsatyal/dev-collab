import { useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { useCreateWorkspaceMutation } from "../../store/api/workspaceApi";
import { WorkspaceCreateData } from "../../types";

export const useWorkspaceMutations = () => {
  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();

  const handleCreateWorkspace = useCallback(
    async (values: WorkspaceCreateData) => {
      try {
        const newWorkspace = await createWorkspace(values).unwrap();
        notifications.show({
          title: "Job done!",
          message: "Workspace created successfully! 🌟",
        });
        return newWorkspace;
      } catch (error) {
        console.error("Failed to create workspace:", error);
        notifications.show({
          title: "Whooops",
          message: "Workspace could not be created.",
          color: "red",
        });
        throw error;
      }
    },
    [createWorkspace],
  );

  return {
    isLoading,
    handleCreateWorkspace,
  };
};
