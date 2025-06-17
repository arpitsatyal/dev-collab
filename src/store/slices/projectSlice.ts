import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IProjectState {
  page: number;
  pageSize: number;
  skip: number;
  projectsOpen: boolean;
  isInsertingProject: false;
}

const initialState: IProjectState = {
  page: 1,
  pageSize: 50,
  skip: 0,
  projectsOpen: false,
  isInsertingProject: false,
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    incrementPage: (state) => {
      state.page += 1;
      state.skip = (state.page - 1) * state.pageSize;
    },

    resetPagination: (state) => {
      state.page = 1;
      state.skip = 0;
    },

    setProjectsOpen: {
      reducer: (state, action: PayloadAction<boolean | undefined>) => {
        state.projectsOpen =
          action.payload === undefined ? !state.projectsOpen : action.payload;
      },
      prepare: (payload?: boolean): { payload: boolean | undefined } => ({
        payload,
      }),
    },

    setInsertingProject(state, action) {
      state.isInsertingProject = action.payload;
    },
  },
});

export const {
  incrementPage,
  resetPagination,
  setProjectsOpen,
  setInsertingProject,
} = projectSlice.actions;
export default projectSlice.reducer;
