import { useRouter } from "next/router";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { SnippetCreate } from "../../../../interfaces";
import Layout from "../../../../components/Layout";
import SnippetBox from "../../../../components/SnippetBox";
import { RoomProvider, useStorage } from "@liveblocks/react";
import { useSession } from "next-auth/react";
import { useCreateSnippetMutation } from "../../../../store/api/snippetApi";
import { useAppDispatch } from "../../../../store/hooks";
import { addSnippet } from "../../../../store/slices/snippetSlice";

const Create = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const rawLanguage = useStorage((root) => root.language);
  const language = typeof rawLanguage === "string" ? rawLanguage : "javascript";

  const [createSnippet, { isLoading }] = useCreateSnippetMutation();
  const dispatch = useAppDispatch();

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleSaveSnippet = async () => {
    try {
      if (!code) throw new Error("No code provided");
      const snippet: SnippetCreate = {
        title,
        content: JSON.stringify(code),
        language,
      };

      const { data } = await createSnippet({
        snippet,
        projectId: projectId as string,
      });
      if (data) {
        dispatch(
          addSnippet({
            projectId: projectId as string,
            snippet: data,
          })
        );
      }
      //todo: handle error
      notifications.show({
        title: "done!",
        message: "Snippet saved successfully! 🌟",
      });
      if (data?.id) {
        router.push(`/projects/${projectId}/snippets/${data.id}`);
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

export default CreateSnippet;
