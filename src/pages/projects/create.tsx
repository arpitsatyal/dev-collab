import Layout from "../../components/Layout/Layout";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { withAuth } from "../../guards/withAuth";
import { ProjectCreateData } from "../api/projects";
import { syncMeiliSearch } from "../../utils/syncMeiliSearch";
import CreateProjectForm from "../../components/Projects/CreateProjectForm";
import { useCreateProjectMutation } from "../../store/api/projectApi";
import { Box } from "@mantine/core";

const CreateProjectPage = () => {
  const router = useRouter();
  const form = useForm<ProjectCreateData>({
    initialValues: {
      title: "",
      description: "",
      ownerId: "",
    },
  });

  const [createProject, { isLoading }] = useCreateProjectMutation();

  const handleSubmit = async () => {
    try {
      const newProject = await createProject(form.values).unwrap();
      notifications.show({
        title: "Job done!",
        message: "Workspace created successfully! 🌟",
      });
      router.push(`/projects/${newProject.id}`);

      await syncMeiliSearch(newProject, "project");
    } catch (error) {
      notifications.show({
        title: "Whooops",
        message: "Workspace could not be created.",
      });
    }
  };

  return (
    <Box py="xl">
      <CreateProjectForm
        form={form}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
      />
    </Box>
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
