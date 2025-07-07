import { useRouter } from "next/router";
import DocsLayout from "../../../../components/Docs/DocsLayout";
import { getSingleQueryParam } from "../../../../utils/getSingleQueryParam";
import TiptapEditor from "../../../../components/Docs/TipTapEditor/TiptapEditor";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react";
import Loading from "../../../../components/Loader/Loader";
import {
  useCreateDocMutation,
  useGetDocsQuery,
} from "../../../../store/api/docsApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { Box, Button, Flex, Text } from "@mantine/core";
import CreateDocModal from "../../../../components/Docs/CreateDocModal";
import { useDisclosure } from "@mantine/hooks";
import { DocCreateData } from "../../../api/docs";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";

const DocsIndex = () => {
  const router = useRouter();
  const docId = getSingleQueryParam(router.query.docId);
  const projectId = getSingleQueryParam(router.query.projectId);
  const [opened, { open, close }] = useDisclosure(false);
  const [createDoc, { isLoading }] = useCreateDocMutation();

  const { data: docs } = useGetDocsQuery(projectId ? { projectId } : skipToken);
  const selectedDoc = docId ? docs?.find((doc) => doc.id === docId) : null;

  const [docForm, setDocForm] = useState<DocCreateData>({
    label: "",
    projectId: "",
    roomId: "",
  });

  useEffect(() => {
    const projectId = getSingleQueryParam(router.query.projectId);
    if (projectId) {
      setDocForm((prev) => ({ ...prev, projectId }));
    }
  }, [router.query.projectId]);

  const handleInputChange = <K extends keyof DocCreateData>(
    field: K,
    value: DocCreateData[K]
  ) => {
    setDocForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!docForm.projectId || docForm.projectId.trim() === "") {
        notifications.show({
          title: "Error",
          message: "Project ID is missing. Cannot create doc.",
          color: "red",
        });
        return;
      }

      await createDoc({
        doc: docForm,
        projectId: docForm.projectId,
      }).unwrap();
      notifications.show({
        title: "Job done!",
        message: "Doc created successfully! 🌟",
      });

      setDocForm({
        label: "",
        projectId: "",
        roomId: "",
      });

      close();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Whooops",
        message: "Doc could not be created.",
      });
    }
  };

  return (
    <DocsLayout>
      {selectedDoc ? (
        <RoomProvider
          id={selectedDoc.roomId}
          initialPresence={{
            cursor: null,
          }}
        >
          <ClientSideSuspense fallback={<Loading isEditorLoading />}>
            <TiptapEditor />
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
            <Button onClick={open}>Add New Doc</Button>
            <CreateDocModal
              opened={opened}
              close={close}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              docForm={docForm}
              isLoading={isLoading}
            />
          </Box>
        </Flex>
      )}
    </DocsLayout>
  );
};

export default DocsIndex;
