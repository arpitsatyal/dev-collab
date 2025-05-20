import { Project } from "@prisma/client";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { projectApi } from "../api/projectApi";

interface ProjectState {
  loadedProjects: Project[];
  isLoading: boolean;
  isCreating: boolean;
  isError: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  loadedProjects: [],
  isLoading: false,
  isCreating: false,
  isError: false,
  error: null,
};

export const ProjectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<{ projects: Project[] }>) => {
      state.loadedProjects = action.payload.projects;
      state.isLoading = false;
      state.isError = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(projectApi.endpoints.getProjects.matchPending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.error = null;
      })
      .addMatcher(
        projectApi.endpoints.getProjects.matchFulfilled,
        (state, action) => {
          state.loadedProjects = action.payload;
          state.isLoading = false;
          state.isError = false;
          state.error = null;
        }
      )
      .addMatcher(
        projectApi.endpoints.getProjects.matchRejected,
        (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.error = action.error.message || "Failed to fetch projects";
        }
      )
      //create project
      .addMatcher(projectApi.endpoints.createProject.matchPending, (state) => {
        state.isCreating = true;
        state.isError = false;
        state.error = null;
      })
      .addMatcher(
        projectApi.endpoints.createProject.matchFulfilled,
        (state, action) => {
          // Add the new project, checking for duplicates
          const index = state.loadedProjects.findIndex(
            (p) => p.id === action.payload.id
          );
          if (index === -1) {
            state.loadedProjects.push(action.payload);
          } else {
            state.loadedProjects[index] = action.payload;
          }
          state.isCreating = false;
          state.isError = false;
          state.error = null;
        }
      )
      .addMatcher(
        projectApi.endpoints.createProject.matchRejected,
        (state, action) => {
          state.isCreating = false;
          state.isError = true;
          state.error = action.error.message || "Failed to create project";
        }
      );
  },
});

export const { setProjects } = ProjectSlice.actions;

export default ProjectSlice.reducer;
