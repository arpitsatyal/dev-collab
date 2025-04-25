import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Project } from "../../interfaces";

export interface IProjectState {
  data: Project[];
}

const initialState: IProjectState = {
  data: [],
};

export const ProjectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    addProject: (state, action: PayloadAction<Project>) => {
      state.data.push(action.payload);
    },
  },
});

export const { addProject } = ProjectSlice.actions;

export default ProjectSlice.reducer;
