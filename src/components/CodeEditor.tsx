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

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function CodeEditor({
  code,
  setCode,
}: {
  code?: string;
  setCode?: (val: string) => void;
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
  const updateCode = useMutation(({ storage }, val: string) => {
    storage.set("code", val);
    if (setCode) {
      setCode(val);
    }
  }, []);

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

  return (
    <MonacoEditor
      height="90vh"
      defaultLanguage="javascript"
      theme="vs-dark"
      value={code ?? storageCode ?? ""}
      onChange={(val) => updateCode(val || "")}
      onMount={handleEditorMount}
    />
  );
}
