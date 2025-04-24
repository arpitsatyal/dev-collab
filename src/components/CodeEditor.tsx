"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  useStorage,
  useMutation,
  useUpdateMyPresence,
  useOthers,
} from "@liveblocks/react";
import type * as monacoType from "monaco-editor";
import { useCursorStyles } from "../utils/cursor";
import { Box, Select, Stack } from "@mantine/core";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function CodeEditor({
  code,
  setCode,
  setHasErrors,
}: {
  code: string;
  setCode: (val: string) => void;
  setHasErrors: (val: boolean) => void;
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

  const storageCode = useStorage((root) => root.code as string);
  const rawLanguage = useStorage((root) => root.language);

  const language = typeof rawLanguage === "string" ? rawLanguage : "javascript";

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

  return (
    <>
      <Stack p="md" style={{ minHeight: "100vh" }} gap="sm">
        <Box w={250} pb="xs">
          <Select
            label="Select Language"
            placeholder="Pick a language"
            data={languageOptions}
            value={language}
            onChange={handleLanguageChange}
          />
        </Box>

        <Box style={{ flexGrow: 1, mt: 5 }}>
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
