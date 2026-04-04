import { useState, useCallback, useMemo, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { Snippet } from "../types";
import { useLazyGetSnippetsQuery } from "../store/api/snippetApi";
import { useSuggestSnippetFilenameMutation } from "../store/api/aiApi";
import { useAppSelector } from "../store/hooks";
import { getExtensionFromLanguage } from "../utils/snippet/languageMapper";
import { inferFallbackBaseName, buildUniqueFilename } from "../utils/snippet/naming";
import { parseFilename } from "../utils/snippet/parser";
import { useSession } from "../components/providers/AuthProvider";
import { useSnippetMutations } from "./mutations/useSnippetMutations";

interface SnippetExportOptions {
  code: string;
  language?: string;
  workspaceId?: string | null;
}

export const useSnippetExport = ({
  code,
  language,
  workspaceId,
}: SnippetExportOptions) => {
  const session = useSession();
  const [triggerGetSnippets, { data: fetchedWorkspaceSnippets = [] }] = useLazyGetSnippetsQuery();
  const [suggestSnippetFilename, { isLoading: isSuggestingFileName }] = useSuggestSnippetFilenameMutation();

  const [opened, setOpened] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileNameError, setFileNameError] = useState("");
  const [saved, setSaved] = useState(false);

  const { confirmExport, isCreatingSnippet } = useSnippetMutations();

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

  const handleConfirmExport = useCallback(async () => {
    if (!workspaceId) return;

    const validationError = validateFileName(fileName);
    if (validationError) {
      setFileNameError(validationError);
      return;
    }

    try {
      await confirmExport({
        code,
        workspaceId,
        fileName,
        normalizedLanguage,
        userId: session.data?.user?.id || null,
      });

      setSaved(true);
      setOpened(false);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (error) {
      // Error handled in mutation hook (toasted)
    }
  }, [code, workspaceId, fileName, normalizedLanguage, session.data?.user?.id, validateFileName, confirmExport]);

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
    confirmExport: handleConfirmExport,
    validateFileName,
  };
};
