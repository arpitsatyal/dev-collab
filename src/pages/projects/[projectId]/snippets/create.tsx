import { useRouter } from "next/router";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import Layout from "../../../../components/Layout";
import { RoomProvider, useStorage } from "@liveblocks/react";
import { useSession } from "next-auth/react";
import { useCreateSnippetMutation } from "../../../../store/api/snippetApi";
import { useAppDispatch } from "../../../../store/hooks";
import { addSnippet } from "../../../../store/slices/snippetSlice";
import { getSingleQueryParam } from "../../../../utils/getSingleQueryParam";
import { languageMapper } from "../../../../utils/languageMapper";
import { withAuth } from "../../../../guards/withAuth";
import axios from "axios";
import { SnippetsCreateData } from "../../../api/snippets";
import SnippetBox from "../../../../components/Snippets/SnippetBox";

const Create = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const rawLanguage = useStorage((root) => root.language);
  const language = typeof rawLanguage === "string" ? rawLanguage : "javascript";
  const projectId = getSingleQueryParam(router.query.projectId);

  const [createSnippet, { isLoading }] = useCreateSnippetMutation();
  const dispatch = useAppDispatch();

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleSaveSnippet = async () => {
    try {
      if (!code || !projectId) throw new Error("Something went wrong");
      const snippet: Omit<SnippetsCreateData, "authorId"> = {
        title,
        content: JSON.stringify(code),
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
      //todo: handle error
      notifications.show({
        title: "done!",
        message: "Snippet saved successfully! 🌟",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/sync`,
          {
            doc: result,
            type: "snippet",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (syncError) {
        console.warn("Sync service failed:", syncError);
      }

      if (result?.id) {
        router.push(`/projects/${projectId}/snippets/${result.id}`);
      }
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
      loading={isLoading}
    />
  );
};

const CreateSnippet = () => {
  const session = useSession();
  const { data } = session || {};

  return (
    <RoomProvider
      id={`snippet_draft_${data?.user.id ?? "-"}`}
      initialStorage={{ code: "", language: "javascript" }}
      initialPresence={{
        cursor: null,
      }}
    >
      <Create />
    </RoomProvider>
  );
};

CreateSnippet.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default CreateSnippet;
