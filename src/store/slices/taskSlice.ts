import { Task } from "@prisma/client";
import { createSlice } from "@reduxjs/toolkit";

export interface ITaskState {
  data: Task[];
}

const initialState: ITaskState = {
  data: [],
};

export const TaskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {},
});

export default TaskSlice.reducer;
