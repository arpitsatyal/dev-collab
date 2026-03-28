import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IWorkspaceState {
  page: number;
  pageSize: number;
  skip: number;
  workspacesOpen: boolean;
  isInsertingWorkspace: false;
}

const initialState: IWorkspaceState = {
  page: 1,
  pageSize: 50,
  skip: 0,
  workspacesOpen: false,
  isInsertingWorkspace: false,
};

export const workspaceSlice = createSlice({
  name: "workspace",
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

    setWorkspacesOpen: {
      reducer: (state, action: PayloadAction<boolean | undefined>) => {
        state.workspacesOpen =
          action.payload === undefined ? !state.workspacesOpen : action.payload;
      },
      prepare: (payload?: boolean): { payload: boolean | undefined } => ({
        payload,
      }),
    },

    setInsertingWorkspace(state, action) {
      state.isInsertingWorkspace = action.payload;
    },
  },
});

export const {
  incrementPage,
  resetPagination,
  setWorkspacesOpen,
  setInsertingWorkspace,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
