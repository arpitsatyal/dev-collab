import { getServerSession, User } from "next-auth";
import { GetServerSideProps } from "next";
import { authOptions } from "./api/auth/[...nextauth]";
import Layout from "../components/Layout";

const Dashboard = ({ user }: { user: User }) => {
  return <p>welcome, {user.name}</p>;
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const user = session?.user ?? null;

  if (!user) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return {
    props: { user },
  };
};

Dashboard.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Dashboard;
