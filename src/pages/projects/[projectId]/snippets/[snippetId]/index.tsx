"use client";

import { useEffect, useState } from "react";
import { Snippet as ISnippet, SnippetUpdate } from "../../../../../interfaces";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import SnippetBox from "../../../../../components/SnippetBox";
import Layout from "../../../../../components/Layout";
import { useSnippet } from "../../../../../hooks/snippets";
import Loading from "../../../../../components/Loader";
import {
  RoomProvider,
  useMutation,
  useRoom,
  useStorage,
} from "@liveblocks/react";
import { useSession } from "next-auth/react";

const SnippetEdit = ({ snippet }: { snippet: ISnippet }) => {
  const router = useRouter();
  const { projectId, snippetId } = router.query;
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const session = useSession();
  const storageCode = useStorage((root) => root.code as string);
  const rawLanguage = useStorage((root) => root.language);
  const language = typeof rawLanguage === "string" ? rawLanguage : "javascript";
  const room = useRoom();
  const status = room.getStorageStatus();

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title ?? "");
      setCode(JSON.parse(snippet.content) ?? "");
    }
  }, [snippet]);

  const setLanguage = useMutation(({ storage }, val: string) => {
    storage.set("language", val);
  }, []);

  useEffect(() => {
    if (status === "synchronized" && snippet?.language) {
      setLanguage(snippet.language);
    }
  }, [status, snippet?.language]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleSaveSnippet = async () => {
    const snippet: SnippetUpdate = {
      title,
      content: JSON.stringify(storageCode),
      language,
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

  if (status === "loading") {
    return <Loading isEditorLoading={true} />;
  }

  return (
    <SnippetBox
      title={title ?? ""}
      isEdit={true}
      handleSaveSnippet={handleSaveSnippet}
      handleTitleChange={handleTitleChange}
      code={code}
      setCode={setCode}
    />
  );
};

const Snippet = () => {
  const router = useRouter();
  const { projectId, snippetId } = router.query;
  const { snippet, loading } = useSnippet(
    projectId as string,
    snippetId as string
  );

  if (loading || !snippetId || !snippet) {
    return <Loading isEditorLoading={true} />;
  }

  return (
    <RoomProvider
      id={`snippet_${snippetId}`}
      initialStorage={{ code: "", language: "javascript" }}
      initialPresence={{
        cursor: null,
      }}
    >
      <SnippetEdit snippet={snippet} />
    </RoomProvider>
  );
};

Snippet.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Snippet;
