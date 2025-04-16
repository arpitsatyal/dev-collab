import { useEffect, useState } from "react";
import { SnippetCreate } from "../../../../../interfaces";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import SnippetBox from "../../../../../components/SnippetBox";
import Layout from "../../../../../components/Layout";
import { useSnippet } from "../../../../../hooks/snippets";
import Loading from "../../../../../components/Loader";

const Snippet = () => {
  const router = useRouter();
  const { projectId, snippetId } = router.query;
  const { snippet, loading } = useSnippet(
    projectId as string,
    snippetId as string
  );

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (snippet && !loading) {
      setTitle(snippet.title ?? "");
      setCode(JSON.parse(snippet.content) ?? "");
    }
  }, [snippet, loading]);

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
      await axios.patch(
        `/api/snippets?projectId=${projectId}&snippetId=${snippetId}`,
        snippet
      );
      notifications.show({
        title: "done!",
        message: "Snippet updated successfully! 🌟",
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
    <>
      {loading ? (
        <Loading />
      ) : (
        <SnippetBox
          code={code ?? ""}
          handleSaveSnippet={handleSaveSnippet}
          handleTitleChange={handleTitleChange}
          setCode={setCode}
          title={title ?? ""}
        />
      )}
    </>
  );
};

Snippet.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Snippet;
