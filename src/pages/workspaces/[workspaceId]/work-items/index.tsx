import { useState } from "react";
import { Container } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { withAuth } from "../../../../guards/withAuth";
import Layout from "../../../../components/Layout/Layout";
import { WorkItemStatus } from "../../../../types";
import { useCreateWorkItemMutation } from "../../../../store/api/workItemApi";
import { notifications } from "@mantine/notifications";
import { getSingleQueryParam } from "../../../../utils/getSingleQueryParam";
import { useRouter } from "next/router";
import { WorkItemCreateData } from "../../../api/work-items";
import CreateWorkItemModal from "../../../../components/WorkItem/CreateWorkItemModal";
import WorkItemBoard from "../../../../components/WorkItem/WorkItemBoard";
import WorkItemInfo from "../../../../components/WorkItem/WorkItemInfo";
import Loading from "../../../../components/Loader/Loader";
import { useGetWorkspaceByIdQuery } from "../../../../store/api/workspaceApi";
import { skipToken } from "@reduxjs/toolkit/query";
import AISuggestions from "../../../../components/WorkItem/AISuggestions";

const WorkItemsPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [createWorkItem, { isLoading }] = useCreateWorkItemMutation();
  const [adoptingIndex, setAdoptingIndex] = useState<number | null>(null);
  const [dismissedIndices, setDismissedIndices] = useState<number[]>([]);
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId);

  const isValidWorkspaceId =
    typeof workspaceId === "string" && workspaceId.trim() !== "";

  const { data: workspaceData } = useGetWorkspaceByIdQuery(
    isValidWorkspaceId ? workspaceId : skipToken
  );

  const [workItemForm, setWorkItemForm] = useState<WorkItemCreateData>({
    title: "",
    description: null,
    status: WorkItemStatus.TODO,
    assignedToId: null,
    dueDate: null,
    workspaceId: workspaceId ?? "",
  });

  const workspaceTitle = workspaceData?.title ?? "Select Workspace";

  const handleInputChange = <K extends keyof WorkItemCreateData>(
    field: K,
    value: WorkItemCreateData[K]
  ) => {
    setWorkItemForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setWorkItemForm({
        title: "",
        description: null,
        status: WorkItemStatus.TODO,
        assignedToId: null,
        dueDate: null,
        workspaceId: workspaceId ?? "",
      });

      const data = await createWorkItem({
        workItem: workItemForm,
        workspaceId: workItemForm.workspaceId,
      }).unwrap();

      if (adoptingIndex !== null) {
        setDismissedIndices((prev) => [...prev, adoptingIndex]);
        setAdoptingIndex(null);
      }

      notifications.show({
        title: "Job done!",
        message: "Work Item created successfully! 🌟",
      });

      close();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Whooops",
        message: "Work Item could not be created.",
      });
    }
  };

  const handleAdoptSuggestion = (suggestion: any, index: number) => {
    setWorkItemForm({
      title: suggestion.title,
      description: suggestion.description,
      status: WorkItemStatus.TODO,
      assignedToId: null,
      dueDate: null,
      workspaceId: workspaceId ?? "",
      snippetIds: [],
    });
    setAdoptingIndex(index);
    open();
  };

  if (!workspaceId || !workspaceData) {
    return <Loading />;
  }

  return (
    <Container size="xl" py="md">
      <AISuggestions
        workspaceId={workspaceId}
        onAdopt={handleAdoptSuggestion}
        dismissedIndices={dismissedIndices}
        onDismiss={(index) => setDismissedIndices((prev) => [...prev, index])}
        onClearDismissed={() => setDismissedIndices([])}
      />

      <WorkItemInfo workspace={workspaceData} open={open} />

      <CreateWorkItemModal
        opened={opened}
        close={close}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        workItemForm={workItemForm}
        isLoading={isLoading}
        workspaceTitle={workspaceTitle}
      />

      <WorkItemBoard />
    </Container>
  );
};

WorkItemsPage.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default WorkItemsPage;
