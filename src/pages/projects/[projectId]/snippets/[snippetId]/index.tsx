import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import Layout from "../../../../../components/Layout/Layout";
import Loading from "../../../../../components/Loader/Loader";
import { RoomProvider, useRoom, useStorage } from "@liveblocks/react";
import { useEditSnippetMutation } from "../../../../../store/api/snippetApi";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { updateSnippet } from "../../../../../store/slices/snippetSlice";
import { getSingleQueryParam } from "../../../../../utils/getSingleQueryParam";
import { Snippet } from "@prisma/client";
import { languageMapper } from "../../../../../utils/languageMapper";
import { SnippetsUpdateData } from "../../../../api/snippets";
import SnippetWorkplace from "../../../../../components/Snippets/SnippetWorkplace";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import useAutoSave, {
  SaveSnippetProps,
} from "../../../../../hooks/useAutoSave";
import { SaveStatus } from "../../../../../types";
import { useSession } from "../../../../../context/SessionProvider";
import { withAuth } from "../../../../../guards/withAuth";

const EditSnippetForm = ({ snippet }: { snippet: Snippet }) => {
  const router = useRouter();
  const { session: user } = useSession();
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
          lastEditedById: user?.id ?? "",
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
        lastEditedById: user?.id ?? "",
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
    return <Loading />;
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
  const isValidId =
    typeof projectId === "string" &&
    projectId.trim() !== "" &&
    typeof snippetId === "string" &&
    snippetId.trim() != "";

  const [snippet, setSnippet] = useState<Snippet | null>();
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );

  useEffect(() => {
    if (isValidId) {
      const foundSnippet = loadedSnippets[projectId]?.find(
        (s) => s.id === snippetId
      );
      setSnippet(foundSnippet || null);
    }
  }, [projectId, snippetId, loadedSnippets, isValidId]);

  if (!isValidId || !snippet) {
    return <Loading />;
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

export const getServerSideProps = withAuth();
export default EditSnippetPage;
