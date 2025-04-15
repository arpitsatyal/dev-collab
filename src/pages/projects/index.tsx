import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import Layout from "../../components/Layout";
import ProjectsTable from "../../components/ProjectsTable";

interface Project {
  id: string;
  title: string;
}

const Projects = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getData = async () => {
    try {
      const response = await axios.get<Project[]>("/api/projects");
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      // throw new Error(error.response?.data || "Failed to fetch projects");
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchProjects = async () => {
      try {
        setError(null); // Clear previous errors
        const data = await getData();
        if (mounted) {
          setProjects(data ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, []);

  return <ProjectsTable loading={loading} error={error} projects={projects} />;
};

Projects.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Projects;
