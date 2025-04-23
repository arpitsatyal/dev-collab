import axios from "axios";
import { useEffect, useState } from "react";
import { Project } from "../interfaces";

export const useProject = (projectId: string) => {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project>();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `/api/projects?projectId=${projectId}`
        );

        setProject(data);
      } catch (err) {
        console.error("Failed to fetch project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return { project, loading };
};

export const useProjects = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/projects");

        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading };
};
