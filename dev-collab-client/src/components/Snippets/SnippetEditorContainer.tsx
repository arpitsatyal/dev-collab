import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Loading from "../Loader/Loader";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react";
import { useAppSelector } from "../../store/hooks";
import { Snippet } from "../../types";
import { EditSnippetForm } from "./EditSnippetForm";
import { isContextReady } from "../../utils/navigation/validators";

const SnippetEditorContainer = () => {
  const router = useRouter();
  const { workspaceId, snippetId } = router.query;
  const isReady = isContextReady(workspaceId, snippetId);

  const [snippet, setSnippet] = useState<Snippet | null>();
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );

  useEffect(() => {
    if (isReady && workspaceId) {
      const foundSnippet = loadedSnippets[workspaceId as string]?.find(
        (s) => s.id === snippetId
      );
      setSnippet(foundSnippet || null);
    }
  }, [workspaceId, snippetId, loadedSnippets, isReady]);

  if (!isReady || !snippet) {
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
      <ClientSideSuspense fallback={<Loading />}>
        <EditSnippetForm snippet={snippet} />
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default SnippetEditorContainer;
