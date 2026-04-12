import { useState } from "react";
import { Container } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { WorkItemStatus } from "../../types";
import { useCreateWorkItemMutation } from "../../store/api/workItemApi";
import { notifications } from "@mantine/notifications";
import { getSingleQueryParam } from "../../utils/navigation/queryParams";
import { useRouter } from "next/router";
import { WorkItemCreateData } from "../../types";
import CreateWorkItemModal from "./CreateWorkItemModal";
import WorkItemBoard from "./WorkItemBoard";
import WorkItemInfo from "./WorkItemInfo";
import BaseLoader from "../shared/base/BaseLoader";
import { useGetWorkspaceByIdQuery } from "../../store/api/workspaceApi";
import { skipToken } from "@reduxjs/toolkit/query";
import AISuggestions from "./AISuggestions";
import { isValidParam } from "../../utils/navigation/validators";

const WorkItemsContainer = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [createWorkItem, { isLoading }] = useCreateWorkItemMutation();
  const [adoptingIndex, setAdoptingIndex] = useState<number | null>(null);
  const [dismissedIndices, setDismissedIndices] = useState<number[]>([]);
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId);

  const isWorkspaceReady = isValidParam(workspaceId);

  const { data: workspaceData } = useGetWorkspaceByIdQuery(
    isWorkspaceReady ? workspaceId : skipToken
  );

  const [workItemForm, setWorkItemForm] = useState<WorkItemCreateData>({
    title: "",
    description: null,
    status: WorkItemStatus.TODO,
    assignedToId: null,
    dueDate: null,
    workspaceId: workspaceId ?? "" });

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
        workspaceId: workspaceId ?? "" });

      await createWorkItem({
        workItem: workItemForm,
        workspaceId: workItemForm.workspaceId }).unwrap();

      if (adoptingIndex !== null) {
        setDismissedIndices((prev) => [...prev, adoptingIndex]);
        setAdoptingIndex(null);
      }

      notifications.show({
        title: "Job done!",
        message: "Work Item created successfully! 🌟" });

      close();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Whooops",
        message: "Work Item could not be created." });
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
      snippetIds: [] });
    setAdoptingIndex(index);
    open();
  };

  if (!workspaceId || !workspaceData) {
    return <BaseLoader />;
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

export default WorkItemsContainer;
