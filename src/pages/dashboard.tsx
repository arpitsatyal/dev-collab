import { signOut } from "next-auth/react";
import { Button, Container, Flex, Text } from "@mantine/core";
import { getServerSession, User } from "next-auth";
import { GetServerSideProps } from "next";
import { authOptions } from "./api/auth/[...nextauth]";

const Dashboard = ({ user }: { user: User }) => {
  return (
    <Container
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Flex direction="column" gap={10}>
        <Text>Signed in as {user.name}</Text>
        <Button variant="filled" onClick={() => signOut()}>
          Sign out
        </Button>
      </Flex>
    </Container>
  );
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

export default Dashboard;
