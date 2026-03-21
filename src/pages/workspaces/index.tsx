import { Box, Text } from "@mantine/core";
import { withAuth } from "../../guards/withAuth";
import Layout from "../../components/Layout/Layout";

const WorkspacesIndex = () => {
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
        Please select a workspace from the sidebar or use the search to find one.
      </Text>
    </Box>
  );
};

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

WorkspacesIndex.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default WorkspacesIndex;
