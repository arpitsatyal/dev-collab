import { Container, Title, Text, Box } from "@mantine/core";
import StatsSummary from "../components/Dashboard/StatsSummary";
import Layout from "../components/Layout/Layout";
import { withAuth } from "../guards/withAuth";
import { Session } from "next-auth";
import React from "react";

const Dashboard = ({ user }: { user: Session["user"] }) => {
  return (
    <Container size="xl" py="xl">
      <Box mb="xl">
        <Title fz={26}>
          Welcome back, {user.name?.split(" ")[0] ?? "Dev"}! 👋
        </Title>
        <Text c="dimmed" size="lg" mt="sm">
          Here&apos;s a quick overview of your workspace activities and content.
        </Text>
      </Box>

      <StatsSummary />
    </Container>
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
