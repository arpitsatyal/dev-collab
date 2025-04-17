import { Box, Button, Stack, TextInput, Text } from "@mantine/core";
import React from "react";
import CodeEditor from "./CodeEditor";
import { RoomProvider } from "@liveblocks/react";
import { useRouter } from "next/router";

interface SnippetBoxProps {
  title: string;
  code: string;
  handleTitleChange: (v: string) => void;
  setCode: (code: string) => void;
  handleSaveSnippet: () => void;
}

const SnippetBox = ({
  title,
  handleTitleChange,
  code,
  setCode,
  handleSaveSnippet,
}: SnippetBoxProps) => {
  const router = useRouter();
  return (
    <Stack p="md" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Text size="xl">Project Workspace - {title}</Text>
      <TextInput
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        label="Snippet Title"
        placeholder="Enter a title for your snippet"
        size="md"
        aria-label="Snippet title input"
      />
      <Box style={{ border: "1px solid #e0e0e0", borderRadius: 4 }}>
        <RoomProvider
          id={`snippet_${router.query.snippetId}`}
          initialPresence={{ cursor: null, code }}
        >
          <CodeEditor code={code} setCode={setCode} />
        </RoomProvider>
      </Box>
      <Button
        onClick={handleSaveSnippet}
        variant="filled"
        color="blue"
        size="md"
        px="xl"
        style={{ alignSelf: "flex-start" }}
        aria-label="Save snippet button"
      >
        Save Snippet
      </Button>
    </Stack>
  );
};

export default SnippetBox;
