"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  useStorage,
  useMutation,
  useUpdateMyPresence,
  useOthers,
  useRoom,
} from "@liveblocks/react";
import type * as monacoType from "monaco-editor";
import { useCursorStyles } from "../utils/cursor";
import {
  Avatar,
  Box,
  Flex,
  Tooltip,
  Select,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import Loading from "./Loader";
import { useSnippetFromRouter } from "../hooks/useSnippetFromRouter";
import { useAppSelector } from "../store/hooks";
import { format } from "date-fns";
import { useUser } from "../hooks/useUser";
import { useMediaQuery } from "@mantine/hooks";
import { useSyncLoading } from "../hooks/useSyncLoading";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function CodeEditor({
  code,
  setCode,
  setHasErrors,
  setLoading,
}: {
  code: string;
  setCode: (val: string) => void;
  setHasErrors: (val: boolean) => void;
  setLoading: (val: boolean) => void;
}) {
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<typeof monacoType | null>(null);
  const decorationsRef = useRef<
    Record<string, monacoType.editor.IEditorDecorationsCollection>
  >({});

  const { classes } = useCursorStyles();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );

  const snippet = useSnippetFromRouter(loadedSnippets);
  const { user, loading: userLoading } =
    useUser(snippet?.lastEditedById ?? snippet?.authorId) || {};
  const storageCode = useStorage((root) => root.code as string);
  const rawLanguage = useStorage((root) => root.language);

  const language = typeof rawLanguage === "string" ? rawLanguage : "javascript";
  const room = useRoom();
  const status = room.getStorageStatus();
  const theme = useMantineTheme();
  const isSmallScreen = useMediaQuery("(max-width: 600px)");

  useSyncLoading(userLoading, setLoading);

  const updateCode = useMutation(({ storage }, val: string) => {
    storage.set("code", val);
    if (setCode) {
      setCode(val);
    }
  }, []);

  const updateLanguage = useMutation(({ storage }, val: string) => {
    storage.set("language", val);
  }, []);

  const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "html", label: "HTML" },
    { value: "json", label: "JSON" },
  ];

  const checkForErrors = (monaco: typeof monacoType) => {
    const markers = monaco.editor.getModelMarkers({ owner: language });
    const errorsExist = markers.some(
      (marker) => marker.severity === monaco.MarkerSeverity.Error
    );
    setHasErrors(errorsExist);
  };

  const handleEditorMount = (
    editor: monacoType.editor.IStandaloneCodeEditor,
    monaco: typeof monacoType
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      updateMyPresence({
        cursor: e.position,
      });
    });

    checkForErrors(monaco);
    monaco.editor.onDidChangeMarkers(() => {
      checkForErrors(monaco);
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const position = editor.getPosition();
    if (position) {
      updateMyPresence({
        cursor: { ...position },
      });
    }

    // Track and update decorations per user
    others.forEach((user) => {
      const cursor = user.presence?.cursor;
      const userId = user.id;

      if (!userId) return;
      const existingCollection = decorationsRef.current[userId];

      if (!cursor) {
        if (existingCollection) {
          existingCollection.clear();
          delete decorationsRef.current[userId];
        }
        return;
      }

      const decorations = [
        {
          range: new monaco.Range(
            cursor.lineNumber,
            cursor.column,
            cursor.lineNumber,
            cursor.column
          ),
          options: {
            className: classes.remoteCursor,
            afterContentClassName: classes.remoteCursorLabel,
            description: `cursor-${userId}`,
          },
        },
      ];

      if (!existingCollection) {
        decorationsRef.current[userId] =
          editor.createDecorationsCollection(decorations);
      } else {
        existingCollection.set(decorations);
      }
    });

    return () => {
      Object.values(decorationsRef.current).forEach((collection) => {
        collection.clear();
      });
      decorationsRef.current = {};
    };
  }, [others]);

  const handleLanguageChange = (val: string | null) => {
    if (val) {
      updateLanguage(val);
    }
  };

  if (status === "loading" || userLoading) {
    return <Loading isEditorLoading />;
  }

  return (
    <>
      <Stack p="md" style={{ minHeight: "100vh" }} gap="sm">
        <Flex pb="xs" justify="space-between" wrap="wrap">
          <Select
            label="Select Language"
            placeholder="Pick a language"
            data={languageOptions}
            value={language}
            onChange={handleLanguageChange}
          />

          {snippet && user ? (
            <Flex
              key={snippet.id}
              direction="column"
              align={isSmallScreen ? "flex-start" : "flex-end"}
              gap="xs"
              style={{
                width: "100%",
                maxWidth: isSmallScreen ? "100%" : "200px",
                padding: isSmallScreen ? theme.spacing.md : 0,
              }}
            >
              <Tooltip label={user.name ?? "Unknown User"} withinPortal>
                <Avatar
                  src={user.image}
                  alt={user.name ?? "User avatar"}
                  radius="xl"
                  size={isSmallScreen ? "sm" : "md"}
                />
              </Tooltip>
              <Text
                size={isSmallScreen ? "xs" : "sm"}
                truncate
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Last Edited:{" "}
                {format(snippet.updatedAt, "MMM d, yyyy 'at' h:mm a")}
              </Text>
            </Flex>
          ) : (
            <></>
          )}
        </Flex>

        <Box style={{ flexGrow: 1 }}>
          <MonacoEditor
            key={language}
            height="90vh"
            defaultLanguage={language}
            theme="vs-dark"
            value={code ?? storageCode ?? ""}
            onChange={(val) => updateCode(val || "")}
            onMount={handleEditorMount}
          />
        </Box>
      </Stack>
    </>
  );
}
