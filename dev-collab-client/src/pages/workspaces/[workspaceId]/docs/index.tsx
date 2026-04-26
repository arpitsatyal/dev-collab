import Layout from "../../../../components/Layout/Layout";
import { withAuth } from "../../../../guards/withAuth";
import DocsContainer from "../../../../components/Docs/DocsContainer";

const DocsPage = () => {
  return <DocsContainer />;
};

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

DocsPage.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default DocsPage;
