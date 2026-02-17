import { useState } from "react";
import { Container } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { withAuth } from "../../../../guards/withAuth";
import Layout from "../../../../components/Layout/Layout";
import { TaskStatus } from "@prisma/client";
import { useCreateTaskMutation } from "../../../../store/api/taskApi";
import { notifications } from "@mantine/notifications";
import { getSingleQueryParam } from "../../../../utils/getSingleQueryParam";
import { useRouter } from "next/router";
import { TaskCreateData } from "../../../api/tasks";
import CreateTaskModal from "../../../../components/Task/CreateTaskModal";
import TaskBoard from "../../../../components/Task/TaskBoard";
import TaskInfo from "../../../../components/Task/TaskInfo";
import Loading from "../../../../components/Loader/Loader";
import { syncMeiliSearch } from "../../../../utils/syncMeiliSearch";
import { useGetProjectByIdQuery } from "../../../../store/api/projectApi";
import { skipToken } from "@reduxjs/toolkit/query";
import AISuggestions from "../../../../components/Task/AISuggestions";

const TasksPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [adoptingIndex, setAdoptingIndex] = useState<number | null>(null);
  const [dismissedIndices, setDismissedIndices] = useState<number[]>([]);
  const router = useRouter();
  const projectId = getSingleQueryParam(router.query.projectId);

  const isValidProjectId =
    typeof projectId === "string" && projectId.trim() !== "";

  const { data: projectData } = useGetProjectByIdQuery(
    isValidProjectId ? projectId : skipToken
  );

  const [taskForm, setTaskForm] = useState<TaskCreateData>({
    title: "",
    description: null,
    status: TaskStatus.TODO,
    assignedToId: null,
    dueDate: null,
    projectId: projectId ?? "",
  });

  const projectTitle = projectData?.title ?? "Select Workspace";

  const handleInputChange = <K extends keyof TaskCreateData>(
    field: K,
    value: TaskCreateData[K]
  ) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setTaskForm({
        title: "",
        description: null,
        status: TaskStatus.TODO,
        assignedToId: null,
        dueDate: null,
        projectId: projectId ?? "",
      });

      const data = await createTask({
        task: taskForm,
        projectId: taskForm.projectId,
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

      await syncMeiliSearch({ ...data, project: projectData }, "task");
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Whooops",
        message: "Work Item could not be created.",
      });
    }
  };

  const handleAdoptSuggestion = (suggestion: any, index: number) => {
    setTaskForm({
      title: suggestion.title,
      description: suggestion.description,
      status: TaskStatus.TODO,
      assignedToId: null,
      dueDate: null,
      projectId: projectId ?? "",
      snippetIds: [],
    });
    setAdoptingIndex(index);
    open();
  };

  if (!projectId || !projectData) {
    return <Loading />;
  }

  return (
    <Container size="xl" py="md">
      <AISuggestions
        projectId={projectId}
        onAdopt={handleAdoptSuggestion}
        dismissedIndices={dismissedIndices}
        onDismiss={(index) => setDismissedIndices((prev) => [...prev, index])}
        onClearDismissed={() => setDismissedIndices([])}
      />

      <TaskInfo project={projectData} open={open} />

      <CreateTaskModal
        opened={opened}
        close={close}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        taskForm={taskForm}
        isLoading={isLoading}
        projectTitle={projectTitle}
      />

      <TaskBoard />
    </Container>
  );
};

TasksPage.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default TasksPage;
