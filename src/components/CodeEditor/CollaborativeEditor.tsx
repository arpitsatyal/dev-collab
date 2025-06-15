import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRoom } from "@liveblocks/react/suspense";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import styles from "./CollaborativeEditor.module.css";
import { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import { extractCode } from "../../utils/extractCode";
import {
  Flex,
  Select,
  Stack,
  Text,
  Tooltip,
  Avatar,
  useComputedColorScheme,
  Switch,
  Box,
} from "@mantine/core";
import { languageOptions } from "../../utils/languageOptions";
import { useMutation, useStorage } from "@liveblocks/react";
import dayjs from "dayjs";
import { useSnippetFromRouter } from "../../hooks/useSnippetFromRouter";
import { useAppSelector } from "../../store/hooks";
import { useGetUserQuery } from "../../store/api/userApi";
import Loading from "../Loader/Loader";
import { Cursors } from "./Cursors/Cursors";
import { DebouncedFunc } from "lodash";
import { IconCheck, IconX } from "@tabler/icons-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface CollaborativeEditorProps {
  code: string;
  saveStatus?: "error" | "saving" | "saved" | "idle";
  debounceSave?: DebouncedFunc<() => Promise<void>>;
}

export function CollaborativeEditor({
  code,
  saveStatus,
  debounceSave,
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

        {debounceSave && (
          <Box w={{ base: "100%", md: "auto" }}>
            <Switch
              checked={autoSaveOn}
              onChange={(event) => setAutoSaveOn(event.currentTarget.checked)}
              color="#0074C2"
              size="md"
              label="Auto Save"
              thumbIcon={
                autoSaveOn ? (
                  <IconCheck
                    size={12}
                    color="var(--mantine-color-teal-6)"
                    stroke={3}
                  />
                ) : (
                  <IconX
                    size={12}
                    color="var(--mantine-color-red-6)"
                    stroke={3}
                  />
                )
              }
            />
            <Text
              c={saveStatus === "saving" ? "yellow" : "green"}
              fs="italic"
              fz="xs"
              mt="xs"
              style={{
                visibility: saveStatus ? "visible" : "hidden",
                minHeight: 16,
              }}
            >
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "All changes saved."}
            </Text>
          </Box>
        )}
        {snippet && user && (
          <Box w={{ base: "100%", md: "auto" }} maw={{ md: 200 }}>
            <Flex
              direction="column"
              align={{ base: "flex-start", md: "flex-end" }}
              gap="xs"
            >
              <Tooltip label={user.name ?? "Unknown User"} withinPortal>
                <Avatar
                  src={user.image}
                  alt={user.name ?? "User avatar"}
                  radius="xl"
                />
              </Tooltip>
              <Text
                fs="italic"
                fz="xs"
                truncate
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Last Saved:{" "}
                {dayjs(snippet.updatedAt).format("MMM D, YYYY [at] h:mm a")}
              </Text>
            </Flex>
          </Box>
        )}
      </Flex>

      {provider ? <Cursors yProvider={provider} /> : null}

      <div className={styles.editorContainer}>
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
