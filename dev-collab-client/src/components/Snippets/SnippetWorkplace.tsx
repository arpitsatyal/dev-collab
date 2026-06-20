import BaseButton from "../shared/base/BaseButton";
import { Box, Stack } from "@mantine/core";
import React from "react";
import classes from "./Snippet.module.css";
import { CollaborativeEditor } from "../CodeEditor/CollaborativeEditor";
import { DebouncedFunc } from "lodash";
import { SaveStatus, Snippet } from "../../types";

interface SnippetWorkplaceProps {
  snippet: Snippet;
  loading: boolean;
  saveStatus: SaveStatus;
  debounceSave: DebouncedFunc<() => Promise<void>>;
  handleManualSave: () => void;
}

const SnippetWorkplace = (props: SnippetWorkplaceProps) => {
  const { snippet, loading, handleManualSave, saveStatus, debounceSave } =
    props;

  return (
    <Stack p="md">
      <Box className={classes.editorBorder}>
        <CollaborativeEditor
          code={snippet.content}
          saveStatus={saveStatus}
          debounceSave={debounceSave}
        />
      </Box>
      <BaseButton
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
      </BaseButton>
    </Stack>
  );
};

export default SnippetWorkplace;
