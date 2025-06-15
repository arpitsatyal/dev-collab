"use client";

import {
  Box,
  Button,
  Stack,
  TextInput,
  Text,
  Flex,
  Group,
  Avatar,
  Paper,
} from "@mantine/core";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { ClientSideSuspense, useOthers } from "@liveblocks/react";
import { useSession } from "next-auth/react";
import Loading from "../Loader/Loader";
import classes from "./Snippet.module.css";
import { CollaborativeEditor } from "../CodeEditor/CollaborativeEditor";
import { DebouncedFunc } from "lodash";

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

type SnippetBoxProps = CommonProps & (EditProps | CreateProps);

const SnippetBox = (props: SnippetBoxProps) => {
  const { title, code, isEdit, loading, handleTitleChange, handleSaveSnippet } =
    props;

  const router = useRouter();
  const others = useOthers();
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
    <Stack p="md" style={{ maxWidth: 800, margin: "0 auto" }}>
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
        <Paper
          shadow="sm"
          p="md"
          radius="md"
          withBorder
          style={{ flex: "1 1 300px", maxWidth: "500px" }}
        >
          <Text
            size="xl"
            fw={600}
            mb="sm"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordWrap: "break-word",
              whiteSpace: "normal",
            }}
            className={classes.title}
          >
            Project Workspace - {title}
          </Text>
          <TextInput
            value={title}
            onChange={(e) => handleNameChange(e)}
            label="Snippet Name"
            labelProps={{ style: { marginBottom: "12px" } }}
            placeholder="Enter the name of your snippet"
            size="md"
            aria-label="Snippet name input"
            variant="filled"
            error={nameError}
          />
        </Paper>

        <Paper
          shadow="sm"
          p="md"
          radius="md"
          withBorder
          style={{ flex: "1 1 200px", maxWidth: "300px" }}
        >
          <Text size="sm" fw={500} mb="xs" className={classes.title}>
            Active Users
          </Text>
          {others.length ? (
            <Stack gap="xs">
              {others.map(({ id, info }) => (
                <Group key={id} wrap="nowrap" align="center">
                  <Avatar
                    src={info.avatar}
                    alt={info.name}
                    radius="xl"
                    size="md"
                  />
                  <Text
                    size="sm"
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {info.name}
                  </Text>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text size="sm" fs="italic" className={classes.secondary}>
              No active users
            </Text>
          )}
        </Paper>
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

export default SnippetBox;
