import { useRef, useEffect, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";

export interface SaveSnippetProps {
  projectId: string | undefined;
  snippetId: string | undefined;
  content: string;
}

interface AutoSaveProps {
  projectId: string | undefined;
  snippetId: string | undefined;
  provider: LiveblocksYjsProvider;
  setSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void;
  saveSnippet: (args: SaveSnippetProps) => Promise<{ success: boolean }>;
}

const useAutoSave = ({
  projectId,
  snippetId,
  provider,
  setSaveStatus,
  saveSnippet,
}: AutoSaveProps) => {
  const lastSavedContentRef = useRef<string | null>(null);

  const saveFn = useCallback(async () => {
    if (!projectId || !snippetId) {
      setSaveStatus("idle");
      return;
    }

    try {
      setSaveStatus("saving");
      const yDoc = provider.getYDoc();
      const yText = yDoc.getText("monaco");
      const codeToSave = yText.toString();

      if (codeToSave === lastSavedContentRef.current) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        return;
      }

      await saveSnippet({ projectId, snippetId, content: codeToSave });

      lastSavedContentRef.current = codeToSave;
      setSaveStatus("saved");

      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error("Auto-save failed:", error.message);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [projectId, snippetId, provider, saveSnippet, setSaveStatus]);

  const debounceSave = useMemo(
    () =>
      debounce(
        () => {
          saveFn();
        },
        2000,
        {
          leading: false,
          trailing: true,
        }
      ),
    [saveFn]
  );

  useEffect(() => {
    return () => {
      debounceSave.cancel();
    };
  }, [debounceSave]);

  return { debounceSave };
};

export default useAutoSave;
