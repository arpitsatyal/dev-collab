"use client";

import { useEffect, useState } from "react";
import { SnippetUpdate } from "../../../../../interfaces";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import SnippetBox from "../../../../../components/SnippetBox";
import Layout from "../../../../../components/Layout";
import { useSnippet } from "../../../../../hooks/snippets";
import Loading from "../../../../../components/Loader";
import { RoomProvider, useStorage } from "@liveblocks/react";
import { useSession } from "next-auth/react";

const SnippetEdit = () => {
  const router = useRouter();
  const { projectId, snippetId } = router.query;
  const { snippet, loading } = useSnippet(
    projectId as string,
    snippetId as string
  );

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const session = useSession();
  const storageCode = useStorage((root) => root.code as string);

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
    const snippet: SnippetUpdate = {
      title,
      content: JSON.stringify(storageCode),
      language: "javascript",
      lastEditedById: session.data?.user.id ?? "",
    };

    try {
      if (!storageCode) throw new Error("No code provided");
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
          title={title ?? ""}
          isEdit={true}
          handleSaveSnippet={handleSaveSnippet}
          handleTitleChange={handleTitleChange}
          code={code}
          setCode={setCode}
        />
      )}
    </>
  );
};

const Snippet = () => {
  const router = useRouter();
  return (
    <RoomProvider
      id={`snippet_${router.query.snippetId}`}
      initialStorage={{ code: "", language: "javascript" }}
      initialPresence={{
        cursor: null,
      }}
    >
      <SnippetEdit />
    </RoomProvider>
  );
};

Snippet.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Snippet;
