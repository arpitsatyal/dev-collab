import Layout from "../../components/Layout/Layout";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { ProjectCreateData } from "../api/projects";
import { syncMeiliSearch } from "../../utils/syncMeiliSearch";
import CreateProjectForm from "../../components/Projects/CreateProjectForm";
import { useCreateProjectMutation } from "../../store/api/projectApi";
import { withAuth } from "../../guards/withAuth";

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
export const getServerSideProps = withAuth();

export default CreateProjectPage;
