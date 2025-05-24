import Layout from "../components/Layout";
import { withAuth } from "../guards/withAuth";
import { Session } from "next-auth";

const Dashboard = ({ user }: { user: Session["user"] }) => {
  return <p>Welcome, {user.name ?? ""}</p>;
};

export const getServerSideProps = withAuth(async (_ctx, session) => {
  return {
    props: {
      user: session.user,
    },
  };
});

Dashboard.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Dashboard;
