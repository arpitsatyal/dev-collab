import Layout from "../../components/Layout";
import ProjectsTable from "../../components/ProjectsTable";
import { useGetProjectsQuery } from "../../store/api/projectApi";

const Projects = () => {
  const { data: projects, isLoading, error } = useGetProjectsQuery();

  return (
    <ProjectsTable
      isLoading={isLoading}
      error={error}
      projects={projects ?? []}
    />
  );
};

Projects.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Projects;
