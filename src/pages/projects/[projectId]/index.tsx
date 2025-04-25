import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import Loading from "../../../components/Loader";
import { Container, Paper, Stack, Text } from "@mantine/core";
import { useGetProjectQuery } from "../../../store/api/projectApi";
import { skipToken } from "@reduxjs/toolkit/query";

const Project = () => {
  const router = useRouter();
  const { projectId } = router.query;

  const shouldFetch = typeof projectId === "string" && projectId.trim() !== "";

  const { data: project, isLoading } = useGetProjectQuery(
    shouldFetch ? projectId : skipToken
  );

  if (!shouldFetch || isLoading) {
    return <Loading />;
  }

  return (
    <Container size="md" p={{ base: "sm", sm: "md" }}>
      <Paper
        shadow="sm"
        p={{ base: "md", sm: "lg" }}
        radius="md"
        withBorder
        style={{ backgroundColor: "#ffffff" }}
      >
        <Stack gap="md">
          <Text size="lg" fw={600} c="#495057">
            {project?.title}
          </Text>
          {project?.description ? (
            <Text size="md" c="#212529">
              {project.description}
            </Text>
          ) : (
            <Text size="md" c="#868e96" fs="italic">
              No description available
            </Text>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

Project.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Project;
