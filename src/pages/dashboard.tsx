import { useSession } from "next-auth/react";
import Layout from "../components/Layout";
import { withAuth } from "../guards/withAuth";
import { Session } from "next-auth";

const Dashboard = ({ user }: { user: Session["user"] }) => {
  const session = useSession();
  return <p>welcome, {user.name ?? ""}</p>;
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
