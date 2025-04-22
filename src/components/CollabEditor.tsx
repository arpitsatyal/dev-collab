"use client";

import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react/suspense";
import { useCallback, useEffect, useState } from "react";
import * as monacoType from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import { Cursors } from "./CollabCursor";
import styles from "./CollabEditor.module.css";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export function CollaborativeEditor() {
  const room = useRoom();
  const provider = getYjsProviderForRoom(room);
  const [editorRef, setEditorRef] =
    useState<monacoType.editor.IStandaloneCodeEditor>();

  // Set up Liveblocks Yjs provider and attach Monaco editor
  useEffect(() => {
    let binding: MonacoBinding;

    if (editorRef) {
      const yDoc = provider.getYDoc();
      const yText = yDoc.getText("monaco");

      // Attach Yjs to Monaco
      binding = new MonacoBinding(
        yText,
        editorRef.getModel() as monacoType.editor.ITextModel,
        new Set([editorRef]),
        provider.awareness as unknown as Awareness
      );
    }

    return () => {
      binding?.destroy();
    };
  }, [editorRef, room]);

  const handleOnMount = useCallback(
    (e: monacoType.editor.IStandaloneCodeEditor) => {
      setEditorRef(e);
    },
    []
  );

  return (
    <div className={styles.container}>
      {provider ? <Cursors yProvider={provider} /> : null}

      <div className={styles.editorContainer}>
        <MonacoEditor
          onMount={handleOnMount}
          height="100vh"
          theme="vs-dark"
          defaultLanguage="typescript"
          defaultValue=""
          options={{
            tabSize: 2,
            padding: { top: 20 },
          }}
        />
      </div>
    </div>
  );
}
