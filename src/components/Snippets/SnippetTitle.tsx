import { Paper, Text, TextInput } from "@mantine/core";
import React from "react";

interface SnippetTitleProps {
  title: string;
  nameError: string;
  handleNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SnippetTitle = ({
  title,
  nameError,
  handleNameChange,
}: SnippetTitleProps) => {
  return (
    <Paper
      shadow="sm"
      p="md"
      radius="md"
      withBorder
      style={{ flex: "1 1 300px", maxWidth: "500px" }}
    >
      <Text
        size="xl"
        fw={600}
        mb="sm"
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          wordWrap: "break-word",
          whiteSpace: "normal",
        }}
        className="title"
      >
        Project Workspace - {title}
      </Text>
      <TextInput
        value={title}
        onChange={(e) => handleNameChange(e)}
        label="Snippet Name"
        labelProps={{ style: { marginBottom: "12px" } }}
        placeholder="Enter the name of your snippet"
        size="md"
        aria-label="Snippet name input"
        variant="filled"
        error={nameError}
      />
    </Paper>
  );
};

export default SnippetTitle;
