import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import CodeEditor from "../../components/CodeEditor";
import { Button, Group, Text } from "@mantine/core";
import axios from "axios";
import { useState } from "react";
import { Snippet } from "../../interfaces/project";
import { notifications } from "@mantine/notifications";

const Project = () => {
  const router = useRouter();
  const { id } = router.query;
  const [code, setCode] = useState("");

  const handleSaveSnippet = async () => {
    const snippet: Snippet = {
      title: `Snippet for Project - ${id}`,
      content: code,
      language: "javascript",
      projectId: id as string,
    };

    try {
      await axios.post(`/api/snippets`, snippet);
      notifications.show({
        title: "done!",
        message: "Snippet added successfully! 🌟",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Group mb={5}>
      <Text>Project Workspace</Text>
      <CodeEditor code={code} setCode={setCode} />
      <Button onClick={handleSaveSnippet}>Save</Button>
    </Group>
  );
};

Project.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Project;
