import React from "react";
import Layout from "../components/Layout/Layout";
import { CollaborativeEditor } from "../components/CodeEditor/CollaborativeEditor";
import { RoomProvider } from "@liveblocks/react";
import { Box, useComputedColorScheme } from "@mantine/core";
import { useRouter } from "next/router";

const Playground = () => {
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const isDark = computedColorScheme === "dark";

  return (
    <Box
      style={{
        border: `1px solid ${
          isDark ? "var(--mantine-color-gray-7)" : "var(--mantine-color-gray-3)"
        }`,
        borderRadius: isDark ? "2px" : "4px",
      }}
    >
      <CollaborativeEditor code="" playgroundMode />
    </Box>
  );
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
