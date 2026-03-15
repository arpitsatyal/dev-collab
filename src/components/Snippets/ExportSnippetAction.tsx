import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Snippet } from "@prisma/client";
import { IconCheck, IconCodePlus, IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useSession } from "../providers/AuthProvider";
import React, { useEffect, useMemo, useState } from "react";
import {
  useCreateSnippetMutation,
  useLazyGetSnippetsQuery,
} from "../../store/api/snippetApi";
import { useSuggestSnippetFilenameMutation } from "../../store/api/aiApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addSnippet,
  removeSnippet,
  updateSnippet,
} from "../../store/slices/snippetSlice";
import { getSingleQueryParam } from "../../utils/getSingleQueryParam";
import {
  getExtensionFromLanguage,
  getLanguageFromExtension,
} from "../../utils/languageMapper";
import {
  inferFallbackBaseName,
} from "../../utils/snippetNaming";

interface ExportSnippetActionProps {
  code: string;
  language?: string;
}

const buildUniqueFilename = (
  baseName: string,
  extension: string,
  existingNames: Set<string>,
): string => {
  const safeBase = baseName || "snippet";
  let candidate = `${safeBase}.${extension}`;
  let index = 1;

  while (existingNames.has(candidate.toLowerCase())) {
    candidate = `${safeBase}_${index}.${extension}`;
    index += 1;
  }

  return candidate;
};

const parseFilename = (
  filename: string,
): { title: string; extension: string } | null => {
  const trimmed = filename.trim();
  const match = trimmed.match(/^([a-zA-Z0-9._-]+)\.([a-zA-Z0-9]+)$/);
  if (!match) {
    return null;
  }

  return {
    title: match[1],
    extension: match[2].toLowerCase(),
  };
};

const ExportSnippetAction = ({ code, language }: ExportSnippetActionProps) => {
  const router = useRouter();
  const session = useSession();
  const dispatch = useAppDispatch();
  const [createSnippet, { isLoading: isCreatingSnippet }] =
    useCreateSnippetMutation();
  const [triggerGetSnippets, { data: fetchedProjectSnippets = [] }] =
    useLazyGetSnippetsQuery();
  const [suggestSnippetFilename, { isLoading: isSuggestingFileName }] =
    useSuggestSnippetFilenameMutation();
  const [opened, setOpened] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileNameError, setFileNameError] = useState("");
  const [saved, setSaved] = useState(false);
  const projectId = getSingleQueryParam(router.query.projectId);

  const loadedProjectSnippets = useAppSelector((state) =>
    projectId ? state.snippet.loadedSnippets[projectId] || [] : [],
  );

  useEffect(() => {
    if (!projectId) {
      return;
    }
    triggerGetSnippets({ projectId });
  }, [projectId, triggerGetSnippets]);

  const normalizedLanguage = useMemo(
    () => (language || "plaintext").toLowerCase(),
    [language],
  );

  const existingFileNames = useMemo(() => {
    const uniqueById = new Map<string, Snippet>();

    [...loadedProjectSnippets, ...fetchedProjectSnippets].forEach((snippet) => {
      uniqueById.set(snippet.id, snippet);
    });

    return new Set(
      [...uniqueById.values()].map((snippet) =>
        `${snippet.title}.${snippet.extension || "txt"}`.toLowerCase(),
      ),
    );
  }, [loadedProjectSnippets, fetchedProjectSnippets]);

  const validateFileName = (value: string): string => {
    const parsed = parseFilename(value);
    if (!parsed) {
      return "Use a valid filename with extension (e.g. auth_service.ts).";
    }

    const fullName = `${parsed.title}.${parsed.extension}`.toLowerCase();
    if (existingFileNames.has(fullName)) {
      return "A snippet with this filename already exists in this project.";
    }

    return "";
  };

  const openFilenamePrompt = async () => {
    const content = code?.trim() ? code : "";

    if (!projectId) {
      notifications.show({
        title: "Unable to export snippet",
        message: "Project context is missing for this code block.",
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
        projectId,
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
        existingFileNames,
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

  const handleConfirmExport = async () => {
    if (!projectId) {
      return;
    }

    const content = code?.trim() ? code : "";
    const validationError = validateFileName(fileName);
    if (validationError) {
      setFileNameError(validationError);
      return;
    }

    const parsed = parseFilename(fileName);
    if (!parsed) {
      setFileNameError(
        "Use a valid filename with extension (e.g. auth_service.ts).",
      );
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
      projectId,
      authorId: session.data?.user?.id || null,
      lastEditedById: session.data?.user?.id || null,
      extension,
    };

    dispatch(
      addSnippet({
        projectId,
        snippet: optimisticSnippet,
      }),
    );

    try {
      const data = await createSnippet({
        projectId,
        snippet: {
          title,
          language: resolvedLanguage,
          content,
          projectId,
          extension,
        },
      }).unwrap();

      dispatch(
        updateSnippet({
          projectId,
          snippetId: tempId,
          editedSnippet: data,
        }),
      );

      setSaved(true);
      setOpened(false);
      window.setTimeout(() => setSaved(false), 1500);
      notifications.show({
        title: "Snippet exported",
        message: `${data.title}.${data.extension || "txt"} saved to this project.`,
        color: "teal",
      });
    } catch (error) {
      dispatch(
        removeSnippet({
          projectId,
          snippetId: tempId,
        }),
      );

      console.error("Failed to export snippet:", error);
      notifications.show({
        title: "Export failed",
        message: "Could not save this code block as a snippet.",
        color: "red",
      });
    }
  };

  return (
    <>
      <Tooltip label={saved ? "Saved" : "Save as snippet"} withArrow>
        <ActionIcon
          onClick={openFilenamePrompt}
          variant="light"
          color={saved ? "teal" : "gray"}
          size="sm"
          loading={isCreatingSnippet || isSuggestingFileName}
          aria-label="Save code block as snippet"
        >
          {isCreatingSnippet || isSuggestingFileName ? (
            <IconLoader2 size={14} />
          ) : saved ? (
            <IconCheck size={14} />
          ) : (
            <IconCodePlus size={14} />
          )}
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Export code block as snippet"
        centered
      >
        <TextInput
          label="Filename"
          value={fileName}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            setFileName(nextValue);
            setFileNameError(validateFileName(nextValue));
          }}
          placeholder="e.g., auth_service.ts"
          error={fileNameError}
          data-autofocus
          disabled={isSuggestingFileName}
        />
        <Text fz="sm" c="dimmed" mt="xs">
          {isSuggestingFileName
            ? "Getting AI filename suggestion..."
            : "Prefilled with an AI-suggested name from the API."}
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmExport}
            loading={isCreatingSnippet}
            disabled={!fileName.trim() || !!fileNameError}
          >
            Save Snippet
          </Button>
        </Group>
      </Modal>
    </>
  );
};

export default ExportSnippetAction;
