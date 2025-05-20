import { Project } from "@prisma/client";
import { projectApi } from "./api/projectApi";
import { AppDispatch } from "./store";

export const fetchProjects = () => async (dispatch: AppDispatch) => {
  dispatch(projectApi.endpoints.getProjects.initiate());
};

export const createNewProject =
  (newProject: Partial<Project>) => async (dispatch: AppDispatch) => {
    try {
      const result = await dispatch(
        projectApi.endpoints.createProject.initiate(newProject)
      ).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  };
