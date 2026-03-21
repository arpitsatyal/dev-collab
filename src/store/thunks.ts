import { Workspace } from "../types";
import { workspaceApi } from "./api/workspaceApi";
import { AppDispatch } from "./store";

export const createNewWorkspace =
  (newWorkspace: Partial<Workspace>) => async (dispatch: AppDispatch) => {
    try {
      const result = await dispatch(
        workspaceApi.endpoints.createWorkspace.initiate(newWorkspace)
      ).unwrap();
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
