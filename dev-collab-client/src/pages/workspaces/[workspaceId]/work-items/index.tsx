import Layout from "../../../../components/Layout/Layout";
import { withAuth } from "../../../../guards/withAuth";
import WorkItemsContainer from "../../../../components/WorkItem/WorkItemsContainer";

const WorkItemsPage = () => {
  return <WorkItemsContainer />;
};

WorkItemsPage.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default WorkItemsPage;
