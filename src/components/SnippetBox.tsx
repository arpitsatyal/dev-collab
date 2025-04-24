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
import CodeEditor from "./CodeEditor";
import { useRouter } from "next/router";
import Loading from "./Loader";
import { useOthers } from "@liveblocks/react";
import { useSession } from "next-auth/react";

interface SnippetBoxProps {
  title: string;
  handleTitleChange: (v: string) => void;
  handleSaveSnippet: () => void;
  isEdit: boolean;
  code: string;
  setCode: (v: string) => void;
}

const SnippetBox = ({
  title,
  handleTitleChange,
  isEdit,
  code,
  setCode,
  handleSaveSnippet,
}: SnippetBoxProps) => {
  const router = useRouter();
  const others = useOthers();
  const session = useSession();
  const [hasErrors, setHasErrors] = useState(false);

  if (isEdit && !router.query.snippetId) {
    return <Loading isEditorLoading />;
  }

  if (!isEdit && !session.data?.user.id) {
    return <Loading isEditorLoading />;
  }

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
          <Text size="xl" fw={600} mb="sm" c="dimmed">
            Project Workspace - {title}
          </Text>
          <TextInput
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            label="Snippet Title"
            placeholder="Enter a title for your snippet"
            size="md"
            aria-label="Snippet title input"
            variant="filled"
          />
        </Paper>

        <Paper
          shadow="sm"
          p="md"
          radius="md"
          withBorder
          style={{ flex: "1 1 200px", maxWidth: "300px" }}
        >
          <Text size="sm" fw={500} mb="xs" c="dimmed">
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
            <Text size="sm" c="dimmed" fs="italic">
              No active users
            </Text>
          )}
        </Paper>
      </Flex>
      <Box style={{ border: "1px solid #e0e0e0", borderRadius: 4 }}>
        <CodeEditor code={code} setCode={setCode} setHasErrors={setHasErrors} />
      </Box>
      <Button
        onClick={handleSaveSnippet}
        variant="filled"
        color="blue"
        size="md"
        px="xl"
        disabled={!title || hasErrors}
        style={{ alignSelf: "flex-start" }}
        aria-label="Save snippet button"
      >
        Save Snippet
      </Button>
    </Stack>
  );
};

export default SnippetBox;
