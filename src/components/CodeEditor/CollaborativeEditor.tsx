import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRoom } from "@liveblocks/react/suspense";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import { extractCode } from "../../utils/extractCode";
import {
  Flex,
  Select,
  Stack,
  useComputedColorScheme,
  Box,
} from "@mantine/core";
import { languageOptions } from "../../utils/languageOptions";
import { useMutation, useStorage } from "@liveblocks/react";
import { useSnippetFromRouter } from "../../hooks/useSnippetFromRouter";
import { useAppSelector } from "../../store/hooks";
import { useGetUserQuery } from "../../store/api/userApi";
import Loading from "../Loader/Loader";
import { Cursors } from "./Cursors";
import { DebouncedFunc } from "lodash";
import ShareButton from "./ShareButton";
import LastSavedInfo from "./LastSavedInfo";
import AutoSaveSwitch from "./AutoSaveSwitch";
import { SaveStatus } from "../../types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface CollaborativeEditorProps {
  code: string;
  saveStatus?: SaveStatus;
  debounceSave?: DebouncedFunc<() => Promise<void>>;
  playgroundMode?: boolean;
}

export function CollaborativeEditor({
  code,
  saveStatus,
  debounceSave,
  playgroundMode = false,
}: CollaborativeEditorProps) {
  const room = useRoom();
  const provider = getYjsProviderForRoom(room);
  const [editorRef, setEditorRef] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const rawLanguage = useStorage((root) => root.language);
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );
  const snippet = useSnippetFromRouter(loadedSnippets);
  const { data: user, isLoading: userLoading } = useGetUserQuery(
    snippet?.lastEditedById ?? snippet?.authorId ?? ""
  );

  const status = room.getStorageStatus();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const [autoSaveOn, setAutoSaveOn] = useState(true);
  const autoSaveOnRef = useRef(autoSaveOn);

  const language = typeof rawLanguage === "string" ? rawLanguage : "javascript";

  useEffect(() => {
    autoSaveOnRef.current = autoSaveOn;
  }, [autoSaveOn]);

  useEffect(() => {
    if (!editorRef) return;

    let isMounted = true;
    const yDoc = provider.getYDoc();
    const yText = yDoc.getText("monaco");
    const actualCode = extractCode(code);

    function maybeInsertInitialCode() {
      const currentYText = yText.toString();
      const alreadyInserted = currentYText.trim()?.length > 0;

      if (!alreadyInserted && actualCode?.trim()) {
        yText.insert(0, actualCode);
      }

      import("y-monaco").then(({ MonacoBinding }) => {
        if (!isMounted || !editorRef) return;

        const model = editorRef.getModel();
        if (!model) return;
        const binding = new MonacoBinding(
          yText,
          editorRef.getModel()!,
          new Set([editorRef]),
          provider.awareness as unknown as Awareness
        );
        bindingRef.current = binding;
      });
    }

    if (provider.synced) {
      maybeInsertInitialCode(); // Already synced — safe to check
    } else {
      provider.once("synced", maybeInsertInitialCode);
    }

    return () => {
      isMounted = false;
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;

        const model = editorRef.getModel();
        if (model) {
          model.deltaDecorations(
            model.getAllDecorations().map((d) => d.id),
            []
          );
        }
      }
    };
  }, [editorRef, provider, code]);

  const updateLanguage = useMutation(({ storage }, val: string) => {
    storage.set("language", val);
  }, []);

  const handleLanguageChange = (val: string | null) => {
    if (val) {
      updateLanguage(val);
    }
  };

  const handleEditorMount = useCallback(
    (e: editor.IStandaloneCodeEditor) => {
      setEditorRef(e);

      const disposable = e.onDidChangeModelContent((event) => {
        if (!event.isFlush && autoSaveOnRef.current && debounceSave) {
          debounceSave();
        }
      });

      return () => {
        disposable.dispose();
      };
    },
    [debounceSave]
  );

  if (status === "loading" || userLoading) {
    return <Loading isEditorLoading />;
  }

  return (
    <Stack p="md" mih="100vh" gap="sm">
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="md"
        wrap="wrap"
      >
        <Box w={{ base: "100%", md: "auto" }}>
          <Select
            label="Select Language"
            placeholder="Pick a language"
            data={languageOptions}
            value={language}
            onChange={handleLanguageChange}
            styles={{ label: { marginBottom: 12 } }}
          />
        </Box>

        {playgroundMode && <ShareButton />}

        {debounceSave && (
          <AutoSaveSwitch
            autoSaveOn={autoSaveOn}
            saveStatus={saveStatus}
            setAutoSaveOn={setAutoSaveOn}
          />
        )}
        {snippet && user && (
          <LastSavedInfo user={user} updatedAt={snippet.updatedAt} />
        )}
      </Flex>

      {provider ? <Cursors yProvider={provider} /> : null}

      <div style={{ flexGrow: 1, height: "90vh" }}>
        <MonacoEditor
          key={language}
          onMount={handleEditorMount}
          height="100%"
          theme={computedColorScheme === "dark" ? "vs-dark" : "vs-light"}
          defaultLanguage={language}
          defaultValue=""
          options={{
            tabSize: 2,
            padding: { top: 20 },
          }}
        />
      </div>
    </Stack>
  );
}
