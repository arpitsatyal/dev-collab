import { useRouter } from "next/router";
import Layout from "../../../components/Layout/Layout";
import Loading from "../../../components/Loader/Loader";
import { withAuth } from "../../../guards/withAuth";
import { useAppSelector } from "../../../store/hooks";
import ProjectDetail from "../../../components/Projects/ProjectDetail";

const ProjectPage = () => {
  const router = useRouter();
  const { projectId } = router.query;

  const shouldFetch = typeof projectId === "string" && projectId.trim() !== "";
  const projects = useAppSelector((state) => state.project.loadedProjects);

  const project = projects.find((project) => project.id === projectId);

  if (!shouldFetch || !project) {
    return <Loading />;
  }

  return <ProjectDetail project={project} />;
};

ProjectPage.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default ProjectPage;
