import Layout from "../../../components/Layout/Layout";
import { withAuth } from "../../../guards/withAuth";
import WorkspaceDetailContainer from "../../../components/Workspaces/WorkspaceDetailContainer";

const WorkspaceDetailPage = () => {
  return <WorkspaceDetailContainer />;
};

WorkspaceDetailPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default WorkspaceDetailPage;
