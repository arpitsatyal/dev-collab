"use client";

import { Box, Button, Stack, Flex } from "@mantine/core";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { ClientSideSuspense } from "@liveblocks/react";
import { useSession } from "next-auth/react";
import Loading from "../Loader/Loader";
import classes from "./Snippet.module.css";
import { CollaborativeEditor } from "../CodeEditor/CollaborativeEditor";
import { DebouncedFunc } from "lodash";
import ActiveCollaborators from "../CodeEditor/ActiveCollaborators";
import SnippetTitle from "./SnippetTitle";

type CommonProps = {
  title: string;
  code: string;
  loading: boolean;
  handleSaveSnippet: () => void;
  handleTitleChange: (v: string) => void;
};

type EditProps = {
  isEdit: true;
  saveStatus: "error" | "saving" | "saved" | "idle";
  debounceSave: DebouncedFunc<() => Promise<void>>;
};

type CreateProps = {
  isEdit: false;
};

type SnippetWorkplaceProps = CommonProps & (EditProps | CreateProps);

const SnippetWorkplace = (props: SnippetWorkplaceProps) => {
  const { title, code, isEdit, loading, handleTitleChange, handleSaveSnippet } =
    props;

  const router = useRouter();
  const session = useSession();
  const [nameError, setNameError] = useState("");

  if (isEdit && !router.query.snippetId) {
    return <Loading isEditorLoading />;
  }

  if (!isEdit && !session.data?.user.id) {
    return <Loading isEditorLoading />;
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleTitleChange(e.target.value);

    const isValid = /^[a-zA-Z0-9._-]+$/.test(e.target.value);

    if (!isValid) {
      setNameError("File name cannot contain spaces or special characters.");
    } else {
      setNameError("");
    }
  };

  return (
    <Stack p="md">
      <Flex
        justify="space-between"
        align="start"
        wrap="wrap"
        gap="lg"
        p={{ base: "sm", sm: "md", md: "lg" }}
        style={{
          minHeight: "100px",
        }}
      >
        <SnippetTitle
          title={title}
          handleNameChange={handleNameChange}
          nameError={nameError}
        />

        <ActiveCollaborators />
      </Flex>

      <Box className={classes.editorBorder}>
        <ClientSideSuspense fallback={<Loading isEditorLoading />}>
          <CollaborativeEditor
            code={code}
            {...(isEdit && {
              saveStatus: props.saveStatus,
              debounceSave: props.debounceSave,
            })}
          />
        </ClientSideSuspense>
      </Box>
      <Button
        onClick={handleSaveSnippet}
        variant="filled"
        color="blue"
        size="md"
        px="xl"
        loading={loading}
        disabled={!title || !!nameError}
        style={{ alignSelf: "flex-start" }}
        aria-label="Save snippet button"
      >
        Save Snippet
      </Button>
    </Stack>
  );
};

export default SnippetWorkplace;
