import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import CodeEditor from "../../components/CodeEditor";
import { Box, Button, Stack, Text, TextInput } from "@mantine/core";
import axios from "axios";
import { useEffect, useState } from "react";
import { Snippet, SnippetCreate } from "../../interfaces";
import { notifications } from "@mantine/notifications";

const Project = () => {
  const router = useRouter();
  const { id } = router.query;
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleSaveSnippet = async () => {
    const snippet: SnippetCreate = {
      title,
      content: JSON.stringify(code),
      language: "javascript",
      projectId: id as string,
    };

    try {
      await axios.post(`/api/snippets`, snippet);
      notifications.show({
        title: "done!",
        message: "Snippet saved successfully! 🌟",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Stack p="md" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Text size="xl">Project Workspace</Text>
      <TextInput
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        label="Snippet Title"
        placeholder="Enter a title for your snippet"
        size="md"
        aria-label="Snippet title input"
      />
      <Box style={{ border: "1px solid #e0e0e0", borderRadius: 4 }}>
        <CodeEditor code={code} setCode={setCode} />
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

Project.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Project;
