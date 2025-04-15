"use client";
import Editor from "@monaco-editor/react";

export default function CodeEditor({
  code = "",
  setCode,
}: {
  code: string;
  setCode: (val: string) => void;
}) {
  console.log(code);

  return (
    <Editor
      height="70vh"
      language="javascript"
      theme="vs-dark"
      value={code}
      onChange={(value) => setCode(value || "")}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
      }}
    />
  );
}
