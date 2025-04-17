"use client";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useRef } from "react";

export default function CodeEditor({
  code = "",
  setCode,
}: {
  code: string;
  setCode: (val: string) => void;
}) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleOnMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  return (
    <>
      <Editor
        height="70vh"
        language="javascript"
        theme="vs-dark"
        value={code}
        onMount={handleOnMount}
        onChange={(value) => {
          setCode(value || "");
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
        }}
      />
    </>
  );
}
