import { useRouter } from "next/router";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { notifications } from "@mantine/notifications";
import Layout from "../../../../components/Layout/Layout";
import { RoomProvider, useRoom, useStorage } from "@liveblocks/react";
import { useCreateSnippetMutation } from "../../../../store/api/snippetApi";
import { useAppDispatch } from "../../../../store/hooks";
import { addSnippet } from "../../../../store/slices/snippetSlice";
import { getSingleQueryParam } from "../../../../utils/getSingleQueryParam";
import { languageMapper } from "../../../../utils/languageMapper";
import { withAuth } from "../../../../guards/withAuth";
import { SnippetsCreateData } from "../../../api/snippets";
import SnippetWorkplace from "../../../../components/Snippets/SnippetWorkplace";
import { syncMeiliSearch } from "../../../../utils/syncMeiliSearch";
import { getYjsProviderForRoom } from "@liveblocks/yjs";

const CreateSnippetForm = () => {
  const room = useRoom();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const rawLanguage = useStorage((root) => root.language);
  const language = typeof rawLanguage === "string" ? rawLanguage : "javascript";
  const projectId = getSingleQueryParam(router.query.projectId);
  const provider = getYjsProviderForRoom(room);

  const [createSnippet, { isLoading }] = useCreateSnippetMutation();
  const dispatch = useAppDispatch();

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleSaveSnippet = async () => {
    try {
      if (!projectId) throw new Error("Something went wrong");

      const yDoc = provider.getYDoc();
      const yText = yDoc.getText("monaco");
      const codeToSave = yText.toString();

      const snippet: Omit<SnippetsCreateData, "authorId"> = {
        title,
        content: JSON.stringify(codeToSave),
        language,
        projectId,
        extension:
          languageMapper.find((lang) => lang.name === language)?.extension ??
          "-",
      };

      const result = await createSnippet({
        snippet,
        projectId,
      }).unwrap();
      if (result) {
        dispatch(
          addSnippet({
            projectId,
            snippet: result,
          })
        );
      }

      notifications.show({
        title: "done!",
        message: "Snippet saved successfully! 🌟",
      });

      if (result?.id) {
        router.push(`/projects/${projectId}/snippets/${result.id}`);
      }

      await syncMeiliSearch(result, "snippet");
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "whoops!",
        message: "Something went wrong.",
      });
    }
  };

  return (
    <SnippetWorkplace
      code=""
      handleSaveSnippet={handleSaveSnippet}
      handleTitleChange={handleTitleChange}
      title={title}
      isEdit={false}
      loading={isLoading}
    />
  );
};

const CreateSnippetPage = () => {
  return (
    <RoomProvider
      id={`snippet_draft_${uuidv4()}`}
      initialStorage={{ code: "", language: "javascript" }}
      initialPresence={{
        cursor: null,
      }}
    >
      <CreateSnippetForm />
    </RoomProvider>
  );
};

CreateSnippetPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default CreateSnippetPage;
