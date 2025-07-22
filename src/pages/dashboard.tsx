import Layout from "../components/Layout/Layout";
import { User } from "@prisma/client";
import { withAuth } from "../guards/withAuth";

const Dashboard = ({ user }: { user: User }) => {
  return <p>Welcome {user.name}</p>;
};

export const getServerSideProps = withAuth();

Dashboard.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Dashboard;
