import { useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { useCreateDocMutation } from "../../store/api/docsApi";
import { DocCreateData } from "../../types";

export const useDocMutations = () => {
  const [createDoc, { isLoading }] = useCreateDocMutation();

  const handleCreateDoc = useCallback(
    async (docForm: DocCreateData) => {
      try {
        if (!docForm.workspaceId || docForm.workspaceId.trim() === "") {
          notifications.show({
            title: "Error",
            message: "Workspace ID is missing. Cannot create doc.",
            color: "red",
          });
          return null;
        }

        const data = await createDoc({
          doc: docForm,
          workspaceId: docForm.workspaceId,
        }).unwrap();

        notifications.show({
          title: "Job done!",
          message: "Doc created successfully! 🌟",
        });

        return data; // Return the data so the component can handle resets/navigation
      } catch (error) {
        console.error("Failed to create doc:", error);
        notifications.show({
          title: "Whooops",
          message: "Doc could not be created.",
          color: "red",
        });
        throw error;
      }
    },
    [createDoc],
  );

  return {
    isLoading,
    handleCreateDoc,
  };
};
