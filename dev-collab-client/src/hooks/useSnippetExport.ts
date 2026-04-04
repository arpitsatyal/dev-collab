import { useState, useCallback, useMemo, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { Snippet } from "../types";
import { useCreateSnippetMutation, useLazyGetSnippetsQuery } from "../store/api/snippetApi";
import { useSuggestSnippetFilenameMutation } from "../store/api/aiApi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addSnippet, removeSnippet, updateSnippet } from "../store/slices/snippetSlice";
import { getExtensionFromLanguage, getLanguageFromExtension } from "../utils/snippet/languageMapper";
import { inferFallbackBaseName, buildUniqueFilename } from "../utils/snippet/naming";
import { parseFilename } from "../utils/snippet/parser";
import { useSession } from "../components/providers/AuthProvider";

interface UseSnippetExportProps {
  code: string;
  language?: string;
  workspaceId?: string | null;
}

export const useSnippetExport = ({
  code,
  language,
  workspaceId,
}: UseSnippetExportProps) => {
  const session = useSession();
  const dispatch = useAppDispatch();

  const [createSnippet, { isLoading: isCreatingSnippet }] = useCreateSnippetMutation();
  const [triggerGetSnippets, { data: fetchedWorkspaceSnippets = [] }] = useLazyGetSnippetsQuery();
  const [suggestSnippetFilename, { isLoading: isSuggestingFileName }] = useSuggestSnippetFilenameMutation();

  const [opened, setOpened] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileNameError, setFileNameError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadedWorkspaceSnippets = useAppSelector((state) =>
    workspaceId ? state.snippet.loadedSnippets[workspaceId] || [] : []
  );

  useEffect(() => {
    if (!workspaceId) return;
    triggerGetSnippets({ workspaceId });
  }, [workspaceId, triggerGetSnippets]);

  const normalizedLanguage = useMemo(
    () => (language || "plaintext").toLowerCase(),
    [language]
  );

  const existingFileNames = useMemo(() => {
    const uniqueById = new Map<string, Snippet>();
    [...loadedWorkspaceSnippets, ...fetchedWorkspaceSnippets].forEach((snippet) => {
      uniqueById.set(snippet.id, snippet);
    });

    return new Set(
      [...uniqueById.values()].map(
        (snippet) => `${snippet.title}.${snippet.extension || "txt"}`.toLowerCase()
      )
    );
  }, [loadedWorkspaceSnippets, fetchedWorkspaceSnippets]);

  const validateFileName = useCallback(
    (value: string): string => {
      const parsed = parseFilename(value);
      if (!parsed) {
        return "Use a valid filename with extension (e.g. auth_service.ts).";
      }

      const fullName = `${parsed.title}.${parsed.extension}`.toLowerCase();
      if (existingFileNames.has(fullName)) {
        return "A snippet with this filename already exists in this workspace.";
      }

      return "";
    },
    [existingFileNames]
  );

  const openPrompt = async () => {
    const content = code?.trim() ? code : "";

    if (!workspaceId) {
      notifications.show({
        title: "Unable to export snippet",
        message: "Workspace context is missing for this code block.",
        color: "red",
      });
      return;
    }

    if (!content) {
      notifications.show({
        title: "Nothing to export",
        message: "This code block is empty.",
        color: "red",
      });
      return;
    }

    setFileName("");
    setFileNameError("");
    setOpened(true);

    try {
      const { fileName: apiSuggestedFileName } = await suggestSnippetFilename({
        workspaceId,
        code: content,
        language: normalizedLanguage,
      }).unwrap();

      setFileName(apiSuggestedFileName);
      setFileNameError(validateFileName(apiSuggestedFileName));
    } catch (error) {
      console.error("Failed to fetch AI filename suggestion:", error);
      const extension = getExtensionFromLanguage(normalizedLanguage);
      const fallbackBaseName = inferFallbackBaseName(content) || "snippet";
      const fallbackFileName = buildUniqueFilename(
        fallbackBaseName,
        extension,
        existingFileNames
      );
      setFileName(fallbackFileName);
      setFileNameError(validateFileName(fallbackFileName));
      notifications.show({
        title: "Filename suggestion unavailable",
        message: "Using a local fallback name. You can edit it before saving.",
        color: "yellow",
      });
    }
  };

  const confirmExport = async () => {
    if (!workspaceId) return;

    const content = code?.trim() ? code : "";
    const validationError = validateFileName(fileName);
    if (validationError) {
      setFileNameError(validationError);
      return;
    }

    const parsed = parseFilename(fileName);
    if (!parsed) {
      setFileNameError("Use a valid filename with extension (e.g. auth_service.ts).");
      return;
    }

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
      authorId: session.data?.user?.id || null,
      lastEditedById: session.data?.user?.id || null,
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
        })
      );

      setSaved(true);
      setOpened(false);
      window.setTimeout(() => setSaved(false), 1500);
      notifications.show({
        title: "Snippet exported",
        message: `${data.title}.${data.extension || "txt"} saved to this workspace.`,
        color: "teal",
      });
    } catch (error) {
      dispatch(removeSnippet({ workspaceId, snippetId: tempId }));
      console.error("Failed to export snippet:", error);
      notifications.show({
        title: "Export failed",
        message: "Could not save this code block as a snippet.",
        color: "red",
      });
    }
  };

  return {
    opened,
    setOpened,
    fileName,
    setFileName,
    fileNameError,
    setFileNameError,
    isCreatingSnippet,
    isSuggestingFileName,
    saved,
    openPrompt,
    confirmExport,
    validateFileName,
  };
};
