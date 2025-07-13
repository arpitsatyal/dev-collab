import Layout from "../components/Layout/Layout";
import { withAuth } from "../guards/withAuth";
import { Session } from "next-auth";
import AIChat from "../components/AIChat/AIChat";

const Dashboard = ({ user }: { user: Session["user"] }) => {
  return (
    <>
      <p>Welcome, {user.name ?? ""}</p>
      <AIChat />
    </>
  );
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
