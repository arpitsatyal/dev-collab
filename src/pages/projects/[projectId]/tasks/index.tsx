import { useState } from "react";
import { Container } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { withAuth } from "../../../../guards/withAuth";
import Layout from "../../../../components/Layout/Layout";
import { TaskStatus } from "@prisma/client";
import { useCreateTaskMutation } from "../../../../store/api/taskApi";
import { notifications } from "@mantine/notifications";
import { useAppSelector } from "../../../../store/hooks";
import { getSingleQueryParam } from "../../../../utils/getSingleQueryParam";
import { useRouter } from "next/router";
import { TaskCreateData } from "../../../api/tasks";
import CreateTaskModal from "../../../../components/Task/CreateTaskModal";
import TaskBoard from "../../../../components/Task/TaskBoard";
import TaskInfo from "../../../../components/Task/TaskInfo";
import Loading from "../../../../components/Loader/Loader";
import { syncMeiliSearch } from "../../../../utils/syncMeiliSearch";
import {
  useGetProjectByIdQuery,
  useGetProjectsQuery,
} from "../../../../store/api/projectApi";

const ProjectTasksPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const router = useRouter();
  const projectId = getSingleQueryParam(router.query.projectId);

  const { pageSize, skip } = useAppSelector((state) => state.project);
  const { data, isLoading: isProjectsLoading } = useGetProjectsQuery({
    skip,
    limit: pageSize,
  });
  const { data: projectData } = useGetProjectByIdQuery(projectId ?? "");

  const project = data?.items.find((project) => project.id === projectId);

  const [taskForm, setTaskForm] = useState<TaskCreateData>({
    title: "",
    description: null,
    status: TaskStatus.TODO,
    assignedToId: null,
    dueDate: null,
    projectId: projectId ?? "",
  });

  const projectTitle =
    data?.items.find((project) => project.id === taskForm.projectId)?.title ??
    "Select Project";

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
      notifications.show({
        title: "Job done!",
        message: "Task created successfully! 🌟",
      });

      close();

      await syncMeiliSearch({ ...data, project: projectData }, "task");
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Whooops",
        message: "Task could be created.",
      });
    }
  };

  if (!projectId || !project || isProjectsLoading) {
    return <Loading />;
  }

  return (
    <Container size="xl" py="md">
      <TaskInfo project={project} open={open} />

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

ProjectTasksPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default ProjectTasksPage;
