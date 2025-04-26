import { createSlice } from "@reduxjs/toolkit";
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
  reducers: {},
});

export default ProjectSlice.reducer;
