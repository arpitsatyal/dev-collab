import Layout from "../../../../components/Layout/Layout";
import { withAuth } from "../../../../guards/withAuth";
import MissionsContainer from "../../../../components/Missions/MissionsContainer";

const MissionsPage = () => {
  return <MissionsContainer />;
};

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

MissionsPage.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default MissionsPage;
