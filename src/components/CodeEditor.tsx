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
import { createStyles } from "@mantine/emotion";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const useStyles = createStyles((theme) => ({
  remoteCursor: {
    position: "absolute",
    borderLeft: `2px solid ${theme.colors.pink[6]}`,
    pointerEvents: "none",
    zIndex: 10,
  },
  remoteCursorLabel: {
    "&::after": {
      content: '"●"',
      position: "absolute",
      color: theme.colors.pink[6],
      fontSize: 11,
      marginLeft: 4,
      top: "-1.2em",
    },
  },
}));

export default function CodeEditor() {
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<typeof monacoType | null>(null);
  const decorationsRef = useRef<
    Record<string, monacoType.editor.IEditorDecorationsCollection>
  >({});

  const { classes } = useStyles();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  const code = useStorage((root) => root.code as string);
  const updateCode = useMutation(({ storage }, val: string) => {
    storage.set("code", val);
  }, []);

  const handleEditorMount = (
    editor: monacoType.editor.IStandaloneCodeEditor,
    monaco: typeof monacoType
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      console.log("Cursor updated:", e.position);
      updateMyPresence({
        cursor: e.position,
      });
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

      console.log({ userId, existingCollection, cursor });

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

  return (
    <MonacoEditor
      height="90vh"
      defaultLanguage="javascript"
      theme="vs-dark"
      value={code ?? ""}
      onChange={(val) => updateCode(val || "")}
      onMount={handleEditorMount}
    />
  );
}
