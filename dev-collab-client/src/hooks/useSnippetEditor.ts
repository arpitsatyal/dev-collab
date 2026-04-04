import { useState, useCallback, useMemo, useEffect } from "react";
import { useRoom, useStorage, useMutation } from "@liveblocks/react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { Snippet, SaveStatus } from "../types";
import { useSnippetMutations } from "./mutations/useSnippetMutations";
import useAutoSave, { SaveSnippetProps } from "./useAutoSave";
import { languageMapper } from "../utils/snippet/languageMapper";

export const useSnippetEditor = (snippet: Snippet, session: any) => {
  const room = useRoom();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const { handleEditSnippet, isLoading } = useSnippetMutations();
  
  // 1. Synchronization state
  const rawLanguage = useStorage((root) => root.language);
  const language = typeof rawLanguage === "string" ? rawLanguage : snippet.language;
  const provider = useMemo(() => getYjsProviderForRoom(room), [room]);

  // 2. Storage synchronization side-effect
  const updateLanguage = useMutation(({ storage }, val: string) => {
    storage.set("language", val);
  }, []);

  useEffect(() => {
    updateLanguage(snippet.language);
  }, [snippet.language, updateLanguage]);

  // 3. Save Orchestration
  const handleAutoSave = useCallback(
    async ({ workspaceId, snippetId, content }: SaveSnippetProps) => {
      if (!workspaceId || !snippetId) return { success: false };

      try {
        await handleEditSnippet(
          workspaceId,
          snippetId,
          {
            ...snippet,
            content: JSON.stringify(content),
            language,
            extension:
              languageMapper.find((lang) => lang.name === language)?.extension ??
              "-",
            lastEditedById: session.data?.user.id ?? "",
          },
          { showNotification: false }
        );
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    },
    [snippet, session, language, handleEditSnippet]
  );

  const { debounceSave } = useAutoSave({
    workspaceId: snippet.workspaceId,
    snippetId: snippet.id,
    provider,
    setSaveStatus,
    saveSnippet: handleAutoSave,
  });

  const handleManualSave = useCallback(async () => {
    try {
      const yDoc = provider.getYDoc();
      const yText = yDoc.getText("monaco");
      const codeToSave = yText.toString();

      await handleEditSnippet(snippet.workspaceId, snippet.id, {
        ...snippet,
        content: JSON.stringify(codeToSave),
        language,
        lastEditedById: session.data?.user.id ?? "",
        extension:
          languageMapper.find((lang) => lang.name === language)?.extension ??
          "-",
      });

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      // Handled in handler
    }
  }, [snippet, session, language, handleEditSnippet, provider]);

  return {
    saveStatus,
    isLoading,
    handleManualSave,
    debounceSave,
  };
};
