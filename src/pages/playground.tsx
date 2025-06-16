import React from "react";
import Layout from "../components/Layout/Layout";
import { CollaborativeEditor } from "../components/CodeEditor/CollaborativeEditor";
import { RoomProvider } from "@liveblocks/react";
import { Box } from "@mantine/core";
import { useRouter } from "next/router";
import ActiveCollaborators from "../components/CodeEditor/ActiveCollaborators";

const Playground = () => {
  return <CollaborativeEditor code="" playgroundMode />;
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
      <Box style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActiveCollaborators />
      </Box>
      <Box style={{ height: "100%" }}>
        <Playground />
      </Box>
    </RoomProvider>
  );
};

PlaygroundPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export default PlaygroundPage;
