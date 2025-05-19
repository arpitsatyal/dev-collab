import { User } from "@liveblocks/client";
import { createSlice } from "@reduxjs/toolkit";

export interface IUserState {
  data: User[];
}

const initialState: IUserState = {
  data: [],
};

export const UserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
});

export default UserSlice.reducer;
