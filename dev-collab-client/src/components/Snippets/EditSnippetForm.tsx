import { Snippet } from "../../types";
import { useSession } from "../providers/AuthProvider";
import { useSnippetEditor } from "../../hooks/useSnippetEditor";
import Loading from "../Loader/Loader";
import SnippetWorkplace from "./SnippetWorkplace";

interface EditSnippetFormProps {
  snippet: Snippet;
}

export const EditSnippetForm = ({ snippet }: EditSnippetFormProps) => {
    const session = useSession();

    const { saveStatus, isLoading, handleManualSave, debounceSave } =
        useSnippetEditor(snippet, session);

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