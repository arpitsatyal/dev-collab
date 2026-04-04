import { Snippet } from "../../types";
import { useSession } from "../providers/AuthProvider";
import { useRoom } from "@liveblocks/react";
import { useSnippetEditor } from "../../hooks/useSnippetEditor";
import Loading from "../Loader/Loader";
import SnippetWorkplace from "./SnippetWorkplace";

interface EditSnippetFormProps {
  snippet: Snippet;
}

export const EditSnippetForm = ({ snippet }: EditSnippetFormProps) => {
    const session = useSession();
    const room = useRoom();
    const status = room.getStorageStatus();

    const { saveStatus, isLoading, handleManualSave, debounceSave } =
        useSnippetEditor(snippet, session);

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