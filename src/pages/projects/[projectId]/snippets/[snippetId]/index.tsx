import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import Layout from "../../../../../components/Layout/Layout";
import Loading from "../../../../../components/Loader/Loader";
import { RoomProvider, useRoom, useStorage } from "@liveblocks/react";
import { useSession } from "next-auth/react";
import {
  useEditSnippetMutation,
  useLazyGetSnippetsQuery,
} from "../../../../../store/api/snippetApi";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  setSnippets,
  updateSnippet,
} from "../../../../../store/slices/snippetSlice";
import { getSingleQueryParam } from "../../../../../utils/getSingleQueryParam";
import { Snippet } from "@prisma/client";
import { languageMapper } from "../../../../../utils/languageMapper";
import { withAuth } from "../../../../../guards/withAuth";
import { SnippetsUpdateData } from "../../../../api/snippets";
import SnippetWorkplace from "../../../../../components/Snippets/SnippetWorkplace";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import useAutoSave, {
  SaveSnippetProps,
} from "../../../../../hooks/useAutoSave";
import { SaveStatus } from "../../../../../types";

const EditSnippetForm = ({ snippet }: { snippet: Snippet }) => {
  const router = useRouter();
  const session = useSession();
  const rawLanguage = useStorage((root) => root.language);
  const language = typeof rawLanguage === "string" ? rawLanguage : "javascript";
  const room = useRoom();
  const status = room.getStorageStatus();
  const [editSnippet, { isLoading }] = useEditSnippetMutation();
  const dispatch = useAppDispatch();

  const projectId = getSingleQueryParam(router.query.projectId);
  const snippetId = getSingleQueryParam(router.query.snippetId);
  const provider = getYjsProviderForRoom(room);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const handleAutoSave = async ({
    projectId,
    snippetId,
    content,
  }: SaveSnippetProps) => {
    try {
      if (!projectId || !snippetId)
        throw new Error("Failed to save Snippet, metadata not provided.");

      const data = await editSnippet({
        projectId,
        snippet: {
          ...snippet,
          content: JSON.stringify(content),
          language,
          extension:
            languageMapper.find((lang) => lang.name === language)?.extension ??
            "-",
          lastEditedById: session.data?.user.id ?? "",
        },
        snippetId,
      }).unwrap();

      dispatch(
        updateSnippet({
          projectId,
          snippetId,
          editedSnippet: data,
        })
      );
      return { success: true };
    } catch (error) {
      console.error("Error while saving snippet", error);
      throw error;
    }
  };

  const { debounceSave } = useAutoSave({
    projectId,
    snippetId,
    provider,
    setSaveStatus,
    saveSnippet: handleAutoSave,
  });

  const handleManualSave = async () => {
    try {
      if (!projectId || !snippetId) throw new Error("Something went wrong");

      const yDoc = provider.getYDoc();
      const yText = yDoc.getText("monaco");
      const codeToSave = yText.toString();

      const updateSnippetMetaData: Omit<SnippetsUpdateData, "authorId"> = {
        ...snippet,
        content: JSON.stringify(codeToSave),
        language,
        lastEditedById: session.data?.user.id ?? "",
        extension:
          languageMapper.find((lang) => lang.name === language)?.extension ??
          "-",
      };

      const data = await editSnippet({
        projectId,
        snippet: updateSnippetMetaData,
        snippetId,
      }).unwrap();

      dispatch(
        updateSnippet({
          projectId,
          snippetId,
          editedSnippet: data,
        })
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <SnippetWorkplace
      snippet={snippet}
      handleManualSave={handleManualSave}
      loading={isLoading}
      debounceSave={debounceSave}
      saveStatus={saveStatus}
    />
  );
};

const EditSnippetPage = () => {
  const router = useRouter();
  const { projectId, snippetId } = router.query;
  const shouldFetch =
    typeof projectId === "string" &&
    projectId.trim() !== "" &&
    typeof snippetId === "string" &&
    snippetId.trim() != "";

  const [snippet, setSnippet] = useState<Snippet | null>();
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
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
  }, [
    projectId,
    snippetId,
    loadedSnippets,
    triggerGetSnippets,
    dispatch,
    shouldFetch,
  ]);

  if (!shouldFetch || !snippetId || !snippet) {
    return <Loading isEditorLoading />;
  }

  return (
    <RoomProvider
      id={`snippet_${snippetId}`}
      initialStorage={{ language: snippet.language }}
      initialPresence={{
        cursor: null,
      }}
    >
      <EditSnippetForm snippet={snippet} />
    </RoomProvider>
  );
};

EditSnippetPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default EditSnippetPage;
