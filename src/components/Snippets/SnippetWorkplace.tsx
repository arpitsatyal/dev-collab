import { Box, Button, Stack } from "@mantine/core";
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useMutation } from "@liveblocks/react";
import { useSession } from "next-auth/react";
import Loading from "../Loader/Loader";
import classes from "./Snippet.module.css";
import { CollaborativeEditor } from "../CodeEditor/CollaborativeEditor";
import { DebouncedFunc } from "lodash";
import { SaveStatus } from "../../types";
import { Snippet } from "@prisma/client";

type SnippetWorkplaceProps = {
  snippet: Snippet;
  loading: boolean;
  saveStatus: SaveStatus;
  debounceSave: DebouncedFunc<() => Promise<void>>;
  handleManualSave: () => void;
};

const SnippetWorkplace = (props: SnippetWorkplaceProps) => {
  const { snippet, loading, handleManualSave, saveStatus, debounceSave } =
    props;

  const router = useRouter();
  const session = useSession();

  const updateLanguage = useMutation(({ storage }, val: string) => {
    storage.set("language", val);
  }, []);

  useEffect(() => {
    updateLanguage(snippet.language);
  }, [snippet.language, updateLanguage]);

  if (!router.query.snippetId || !session.data?.user.id) {
    return <Loading isEditorLoading />;
  }

  return (
    <Stack p="md">
      <Box className={classes.editorBorder}>
        <CollaborativeEditor
          code={snippet.content}
          saveStatus={saveStatus}
          debounceSave={debounceSave}
        />
      </Box>
      <Button
        onClick={handleManualSave}
        variant="filled"
        color="blue"
        size="md"
        px="xl"
        loading={loading}
        style={{ alignSelf: "flex-start" }}
        aria-label="Save snippet button"
      >
        Save Snippet
      </Button>
    </Stack>
  );
};

export default SnippetWorkplace;
