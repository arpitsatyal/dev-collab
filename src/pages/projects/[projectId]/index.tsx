import { useRouter } from "next/router";
import Layout from "../../../components/Layout/Layout";
import Loading from "../../../components/Loader/Loader";
import ProjectDetail from "../../../components/Projects/ProjectDetail";
import { useGetProjectByIdQuery } from "../../../store/api/projectApi";
import { getSingleQueryParam } from "../../../utils/getSingleQueryParam";
import { skipToken } from "@reduxjs/toolkit/query";
import { withAuth } from "../../../guards/withAuth";

const ProjectDetailPage = () => {
  const router = useRouter();
  const projectId = getSingleQueryParam(router.query.projectId);

  const shouldFetch = typeof projectId === "string" && projectId.trim() !== "";
  const {
    data: project,
    isLoading,
    isError,
  } = useGetProjectByIdQuery(shouldFetch ? projectId : skipToken);

  if (!shouldFetch || !project || isLoading || isError) {
    return <Loading />;
  }

  return <ProjectDetail project={project} />;
};

ProjectDetailPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth();
export default ProjectDetailPage;
