import Layout from "../../components/Layout/Layout";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { withAuth } from "../../guards/withAuth";
import { WorkspaceCreateData } from "../../types";
import CreateWorkspaceForm from "../../components/Workspaces/CreateWorkspaceForm";
import { useCreateWorkspaceMutation } from "../../store/api/workspaceApi";
import { Box } from "@mantine/core";

const CreateWorkspacePage = () => {
  const router = useRouter();
  const form = useForm<WorkspaceCreateData>({
    initialValues: {
      title: "",
      description: "",
      ownerId: "",
    },
  });

  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();

  const handleSubmit = async () => {
    try {
      const newWorkspace = await createWorkspace(form.values).unwrap();
      notifications.show({
        title: "Job done!",
        message: "Workspace created successfully! 🌟",
      });
      router.push(`/workspaces/${newWorkspace.id}`);
    } catch (error) {
      notifications.show({
        title: "Whooops",
        message: "Workspace could not be created.",
      });
    }
  };

  return (
    <Box py="xl">
      <CreateWorkspaceForm
        form={form}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
      />
    </Box>
  );
};

CreateWorkspacePage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default CreateWorkspacePage;
