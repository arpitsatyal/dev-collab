import { useRouter } from "next/router";
import axios from "axios";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { SnippetCreate } from "../../../../interfaces";
import Layout from "../../../../components/Layout";
import SnippetBox from "../../../../components/SnippetBox";

const CreateSnippet = () => {
  const router = useRouter();
  const { projectId } = router.query;
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
    };

    try {
      await axios.post(`/api/snippets?projectId=${projectId}`, snippet);
      notifications.show({
        title: "done!",
        message: "Snippet saved successfully! 🌟",
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "whoops!",
        message: "Something went wrong.",
      });
    }
  };

  return (
    <SnippetBox
      code={code}
      handleSaveSnippet={handleSaveSnippet}
      handleTitleChange={handleTitleChange}
      setCode={setCode}
      title={title}
      isEdit={false}
    />
  );
};

CreateSnippet.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default CreateSnippet;
