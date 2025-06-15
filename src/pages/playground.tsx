import React, { useEffect, useState } from "react";
import Layout from "../components/Layout/Layout";
import { CollaborativeEditor } from "../components/CodeEditor/CollaborativeEditor";
import { RoomProvider } from "@liveblocks/react";
import {
  Box,
  Button,
  CopyButton,
  Group,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useRouter } from "next/router";
import { IconCheck, IconCopy } from "@tabler/icons-react";

const ShareBar = () => {
  const router = useRouter();
  const { roomId } = router.query;
  const [link, setLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && typeof roomId === "string") {
      setLink(`${window.location.origin}/playground?roomId=${roomId}`);
    }
  }, [roomId]);

  return (
    <Group
      align="center"
      px="md"
      py="sm"
      style={{
        borderRadius: 12,
      }}
    >
      <TextInput
        value={link}
        readOnly
        radius="md"
        style={{ flex: 1 }}
        size="sm"
      />
      <CopyButton value={link} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? "Copied!" : "Copy link"} position="right">
            <Button
              onClick={copy}
              leftSection={
                copied ? <IconCheck size={16} /> : <IconCopy size={16} />
              }
              size="sm"
              radius="md"
              color={copied ? "teal" : "blue"}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
};

const Playground = () => {
  return <CollaborativeEditor code="" />;
};

const PlaygroundPage = () => {
  const router = useRouter();
  const { roomId } = router.query;

  if (!roomId || typeof roomId !== "string") {
    return <div>Missing room ID. Please generate a new room.</div>;
  }

  return (
    <RoomProvider
      id={`playground_${roomId}`}
      initialPresence={{
        cursor: null,
      }}
    >
      <Box style={{ height: "100vh" }}>
        <ShareBar />
        <Playground />
      </Box>
    </RoomProvider>
  );
};

PlaygroundPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export default PlaygroundPage;
