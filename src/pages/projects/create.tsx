import Layout from "../../components/Layout/Layout";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { withAuth } from "../../guards/withAuth";
import { ProjectCreateData } from "../api/projects";
import { createNewProject } from "../../store/thunks";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { syncMeiliSearch } from "../../utils/syncMeiliSearch";
import CreateProjectForm from "../../components/Projects/CreateProjectForm";

const CreateProjectPage = () => {
  const router = useRouter();
  const form = useForm<ProjectCreateData>({
    initialValues: {
      title: "",
      description: "",
      ownerId: "",
    },
  });

  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.project.isCreating);

  const handleSubmit = async () => {
    try {
      const newProject = await dispatch(createNewProject(form.values));
      notifications.show({
        title: "Job done!",
        message: "Project created successfully! 🌟",
      });
      router.push(`/projects/${newProject.id}`);

      await syncMeiliSearch(newProject, "project");
    } catch (error) {
      notifications.show({
        title: "Whooops",
        message: "Project could be created.",
      });
    }
  };

  return (
    <CreateProjectForm
      form={form}
      isLoading={isLoading}
      handleSubmit={handleSubmit}
    />
  );
};

CreateProjectPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default CreateProjectPage;
