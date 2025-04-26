"use client";

import { useEffect, useState } from "react";
import { Snippet as ISnippet, SnippetUpdate } from "../../../../../interfaces";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import SnippetBox from "../../../../../components/SnippetBox";
import Layout from "../../../../../components/Layout";
import Loading from "../../../../../components/Loader";
import {
  RoomProvider,
  useMutation,
  useRoom,
  useStorage,
} from "@liveblocks/react";
import { useSession } from "next-auth/react";
import {
  useEditSnippetMutation,
  useLazyGetSnippetsQuery,
} from "../../../../../store/api/snippetApi";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../store/store";
import { useAppDispatch } from "../../../../../store/hooks";
import {
  setSnippets,
  updateSnippet,
} from "../../../../../store/slices/snippetSlice";

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
  const [editSnippet, { isLoading }] = useEditSnippetMutation();
  const dispatch = useAppDispatch();

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
      await editSnippet({
        projectId: projectId as string,
        snippet,
        snippetId: snippetId as string,
      });
      dispatch(
        updateSnippet({
          projectId: projectId as string,
          snippetId: snippetId as string,
          editedSnippet: snippet,
        })
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      // todo: handle error
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
    return <Loading isEditorLoading />;
  }

  return (
    <SnippetBox
      title={title ?? ""}
      isEdit={true}
      handleSaveSnippet={handleSaveSnippet}
      handleTitleChange={handleTitleChange}
      code={code}
      setCode={setCode}
      loading={isLoading}
    />
  );
};

const Snippet = () => {
  const router = useRouter();
  const { projectId, snippetId } = router.query;
  const shouldFetch =
    typeof projectId === "string" &&
    projectId.trim() !== "" &&
    typeof snippetId === "string" &&
    snippetId.trim() != "";

  const [snippet, setSnippet] = useState<ISnippet | null>();
  const loadedSnippets = useSelector(
    (state: RootState) => state.snippet.loadedSnippets
  );
  const dispatch = useAppDispatch();
  const [triggerGetSnippets] = useLazyGetSnippetsQuery();

  useEffect(() => {
    const fetchSnippets = async () => {
      if (projectId && shouldFetch) {
        if (loadedSnippets[projectId]) {
          const foundSnippet = loadedSnippets[projectId].find(
            (s) => s.id === snippetId
          );
          setSnippet(foundSnippet || null);
        } else {
          try {
            const result = await triggerGetSnippets({
              projectId,
            }).unwrap();
            dispatch(setSnippets({ projectId, snippets: result }));
            const foundSnippet = result.find((s) => s.id === snippetId);
            setSnippet(foundSnippet || null);
          } catch (e) {
            console.error("Failed to load snippets", e);
          }
        }
      }
    };

    fetchSnippets();
  }, [projectId, snippetId, loadedSnippets, triggerGetSnippets, dispatch]);

  if (!shouldFetch || !snippetId || !snippet) {
    return <Loading isEditorLoading />;
  }

  return (
    <RoomProvider
      id={`snippet_${snippetId}`}
      initialStorage={{ code: snippet.content, language: snippet.language }}
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
