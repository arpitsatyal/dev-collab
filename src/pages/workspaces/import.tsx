
import Layout from "../../components/Layout/Layout";
import { withAuth } from "../../guards/withAuth";
import ImportWorkspaceForm from "../../components/Workspaces/ImportWorkspaceForm";
import { Box, Title, Container } from "@mantine/core";

const ImportWorkspacePage = () => {
    return (
        <Container size="md" py="xl">
            <Box mb="xl" ta="center">
                <Title order={2} fw={700}>Import Workspace</Title>
            </Box>
            <ImportWorkspaceForm />
        </Container>
    );
};

ImportWorkspacePage.getLayout = (page: React.ReactElement) => (
    <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
    return {
        props: {},
    };
});

export default ImportWorkspacePage;
