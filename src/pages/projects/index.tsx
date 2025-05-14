import { Box, Text } from "@mantine/core";
import Layout from "../../components/Layout";
import { withAuth } from "../../guards/withAuth";

const Projects = () => {
  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
      }}
    >
      <Text>
        Please select a project from the sidebar or use the search to find one.
      </Text>
    </Box>
  );
};

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

Projects.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Projects;
