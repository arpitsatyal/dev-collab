import { useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { Snippet, SnippetsCreateData } from "../../types";
import {
  useCreateSnippetMutation,
  useEditSnippetMutation,
} from "../../store/api/snippetApi";
import { useAppDispatch } from "../../store/hooks";
import {
  addSnippet,
  removeSnippet,
  updateSnippet,
} from "../../store/slices/snippetSlice";
import { getLanguageFromExtension } from "../../utils/snippet/languageMapper";
import { parseFilename } from "../../utils/snippet/parser";

export interface SnippetMutationOptions {
  showNotification?: boolean;
}

export const useSnippetMutations = () => {
  const dispatch = useAppDispatch();
  const [createSnippet, { isLoading: isCreatingSnippet }] =
    useCreateSnippetMutation();
  const [editSnippet, { isLoading: isEditingSnippet }] =
    useEditSnippetMutation();

  const handleCreateSnippet = useCallback(
    async (
      workspaceId: string,
      snippet: Omit<SnippetsCreateData, "authorId">,
      options: SnippetMutationOptions = {},
    ) => {
      const { showNotification = true } = options;
      try {
        const data = await createSnippet({
          workspaceId,
          snippet,
        }).unwrap();

        dispatch(
          addSnippet({
            workspaceId,
            snippet: data,
          }),
        );
        if (showNotification) {
          notifications.show({
            title: "Done!",
            message: "Snippet created successfully! 🌟",
          });
        }
        return data;
      } catch (error) {
        console.error("Failed to create snippet:", error);
        notifications.show({
          title: "Whoops!",
          message: "Could not create snippet.",
          color: "red",
        });
        throw error;
      }
    },
    [createSnippet, dispatch],
  );

  const handleEditSnippet = useCallback(
    async (
      workspaceId: string,
      snippetId: string,
      snippet: Snippet,
      options: SnippetMutationOptions = {},
    ) => {
      const { showNotification = true } = options;
      try {
        const data = await editSnippet({
          workspaceId,
          snippet,
          snippetId,
        }).unwrap();

        dispatch(
          updateSnippet({
            workspaceId,
            snippetId,
            editedSnippet: data,
          }),
        );

        if (showNotification) {
          notifications.show({
            title: "Done!",
            message: "Snippet updated successfully! 🌟",
          });
        }
        return data;
      } catch (error) {
        console.error("Failed to update snippet:", error);
        notifications.show({
          title: "Whoops!",
          message: "Could not update snippet.",
          color: "red",
        });
        throw error;
      }
    },
    [editSnippet, dispatch],
  );

  const confirmExport = useCallback(
    async ({
      code,
      workspaceId,
      fileName,
      normalizedLanguage,
      userId,
    }: {
      code: string;
      workspaceId: string;
      fileName: string;
      normalizedLanguage: string;
      userId: string | null;
    }) => {
      const content = code?.trim() ? code : "";
      const parsed = parseFilename(fileName);
      if (!parsed) return null;

      const now = new Date();
      const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const title = parsed.title;
      const extension = parsed.extension;
      const resolvedLanguage =
        getLanguageFromExtension(extension) === "plaintext"
          ? normalizedLanguage
          : getLanguageFromExtension(extension);

      const optimisticSnippet: Snippet = {
        id: tempId,
        title,
        language: resolvedLanguage,
        content,
        createdAt: now,
        updatedAt: now,
        workspaceId,
        authorId: userId,
        lastEditedById: userId,
        extension,
      };

      dispatch(addSnippet({ workspaceId, snippet: optimisticSnippet }));

      try {
        const data = await createSnippet({
          workspaceId,
          snippet: {
            title,
            language: resolvedLanguage,
            content,
            workspaceId,
            extension,
          },
        }).unwrap();

        dispatch(
          updateSnippet({
            workspaceId,
            snippetId: tempId,
            editedSnippet: data,
          }),
        );

        notifications.show({
          title: "Snippet exported",
          message: `${data.title}.${data.extension || "txt"} saved to this workspace.`,
          color: "teal",
        });
        return data;
      } catch (error) {
        dispatch(removeSnippet({ workspaceId, snippetId: tempId }));
        console.error("Failed to export snippet:", error);
        notifications.show({
          title: "Export failed",
          message: "Could not save this code block as a snippet.",
          color: "red",
        });
        throw error;
      }
    },
    [createSnippet, dispatch],
  );

  return {
    handleCreateSnippet,
    handleEditSnippet,
    confirmExport,
    isLoading: isCreatingSnippet || isEditingSnippet,
    isCreatingSnippet,
    isEditingSnippet,
  };
};
