import Layout from "../../components/Layout/Layout";
import { withAuth } from "../../guards/withAuth";
import CreateWorkspaceForm from "../../components/Workspaces/CreateWorkspaceForm";
import { Box } from "@mantine/core";

const CreateWorkspacePage = () => {
  return (
    <Box py="xl">
      <CreateWorkspaceForm />
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
