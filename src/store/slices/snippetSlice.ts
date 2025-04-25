import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Snippet } from "../../interfaces";

export interface ISnippetState {
  data: Snippet[];
}

const initialState: ISnippetState = {
  data: [],
};

export const SnippetSlice = createSlice({
  name: "snippet",
  initialState,
  reducers: {
    addSnippet: (state, action: PayloadAction<Snippet>) => {
      state.data.push(action.payload);
    },
  },
});

export const { addSnippet } = SnippetSlice.actions;

export default SnippetSlice.reducer;
