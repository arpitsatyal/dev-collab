import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import Loading from "../../../components/Loader";
import { Container, Paper, Stack, Text } from "@mantine/core";
import { withAuth } from "../../../guards/withAuth";
import { useAppSelector } from "../../../store/hooks";

const ProjectPage = () => {
  const router = useRouter();
  const { projectId } = router.query;

  const shouldFetch = typeof projectId === "string" && projectId.trim() !== "";
  const projects = useAppSelector((state) => state.project.loadedProjects);
  const project = projects.find((project) => project.id === projectId);

  if (!shouldFetch || !project) {
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

ProjectPage.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default ProjectPage;
