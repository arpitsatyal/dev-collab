import BaseButton from "../shared/base/BaseButton";
import { useRouter } from "next/router";
import DocsLayout from "./DocsLayout";
import { getSingleQueryParam } from "../../utils/navigation/queryParams";
import TiptapEditor from "./TipTapEditor/TiptapEditor";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react";
import BaseLoader from "../shared/base/BaseLoader";
import { useGetDocsQuery } from "../../store/api/docsApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { Box, Flex, Text } from "@mantine/core";
import CreateDocModal from "./CreateDocModal";
import { useDisclosure } from "@mantine/hooks";
import { useMemo } from "react";
import { isValidParam } from "../../utils/navigation/validators";

const DocsContainer = () => {
  const router = useRouter();
  const docId = getSingleQueryParam(router.query.docId);
  const workspaceId = getSingleQueryParam(router.query.workspaceId);
  const [opened, { open, close }] = useDisclosure(false);

  const isWorkspaceReady = useMemo(
    () => isValidParam(workspaceId),
    [workspaceId],
  );

  const { data: docs } = useGetDocsQuery(
    isWorkspaceReady ? { workspaceId: workspaceId as string } : skipToken,
  );
  const selectedDoc = docId ? docs?.find((doc) => doc.id === docId) : null;

  const markdownContent =
    typeof selectedDoc?.content === "string" &&
    selectedDoc.content.trim().length > 0
      ? selectedDoc.content
      : null;

  return (
    <DocsLayout>
      {selectedDoc ? (
        <RoomProvider
          id={selectedDoc.roomId}
          initialPresence={{
            cursor: null,
          }}
        >
          <ClientSideSuspense fallback={<BaseLoader isEditorLoading />}>
            <TiptapEditor initialContent={markdownContent} />
          </ClientSideSuspense>
        </RoomProvider>
      ) : (
        <Flex
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          gap={{ base: 30, md: 0 }}
        >
          <Text>Select a document from the sidebar or add a new one.</Text>
          <Box>
            <BaseButton onClick={open}>Add New Doc</BaseButton>
            <CreateDocModal opened={opened} close={close} />
          </Box>
        </Flex>
      )}
    </DocsLayout>
  );
};

export default DocsContainer;
