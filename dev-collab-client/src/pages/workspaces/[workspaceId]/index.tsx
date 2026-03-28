import { useRouter } from "next/router";
import Layout from "../../../components/Layout/Layout";
import Loading from "../../../components/Loader/Loader";
import { withAuth } from "../../../guards/withAuth";
import WorkspaceDetail from "../../../components/Workspaces/WorkspaceDetail";
import { useGetWorkspaceByIdQuery } from "../../../store/api/workspaceApi";
import { getSingleQueryParam } from "../../../utils/getSingleQueryParam";
import { skipToken } from "@reduxjs/toolkit/query";

const WorkspaceDetailPage = () => {
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId);

  const shouldFetch = typeof workspaceId === "string" && workspaceId.trim() !== "";
  const {
    data: workspace,
    isLoading,
    isError,
  } = useGetWorkspaceByIdQuery(shouldFetch ? workspaceId : skipToken);

  if (!shouldFetch || !workspace || isLoading || isError) {
    return <Loading />;
  }

  return <WorkspaceDetail workspace={workspace} />;
};

WorkspaceDetailPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default WorkspaceDetailPage;
