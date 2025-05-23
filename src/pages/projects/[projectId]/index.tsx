import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import Loading from "../../../components/Loader";
import {
  Container,
  Paper,
  Stack,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { withAuth } from "../../../guards/withAuth";
import { useAppSelector } from "../../../store/hooks";

const ProjectPage = () => {
  const router = useRouter();
  const { projectId } = router.query;

  const shouldFetch = typeof projectId === "string" && projectId.trim() !== "";
  const projects = useAppSelector((state) => state.project.loadedProjects);
  const { colorScheme } = useMantineColorScheme();
  const project = projects.find((project) => project.id === projectId);

  const backgroundColor = colorScheme === "dark" ? "dark.6" : "white";
  const titleColor = colorScheme === "dark" ? "gray.0" : "gray.7";
  const descriptionColor = colorScheme === "dark" ? "gray.2" : "gray.8";
  const noDescriptionColor = colorScheme === "dark" ? "gray.5" : "gray.5";

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
        bg={backgroundColor}
      >
        <Stack gap="md">
          <Text size="lg" fw={600} c={titleColor}>
            {project?.title}
          </Text>
          {project?.description ? (
            <Text size="md" c={descriptionColor}>
              {project.description}
            </Text>
          ) : (
            <Text size="md" c={noDescriptionColor} fs="italic">
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
    props: {
      colorScheme: "light",
    },
  };
});

export default ProjectPage;
