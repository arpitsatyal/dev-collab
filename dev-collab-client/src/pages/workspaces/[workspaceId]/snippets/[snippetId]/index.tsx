import Layout from "../../../../../components/Layout/Layout";
import { withAuth } from "../../../../../guards/withAuth";
import SnippetEditorContainer from "../../../../../components/Snippets/SnippetEditorContainer";

const EditSnippetPage = () => {
  return <SnippetEditorContainer />;
};

EditSnippetPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default EditSnippetPage;
