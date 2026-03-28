import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQuery,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "users",
      providesTags: (result) => (result ? [{ type: "Users", id: "LIST" }] : []),
    }),
    getUser: builder.query<User, string>({
      query: (id) => `users/${id}`,
    }),
    getUserStats: builder.query<{ workspaces: number; snippets: number; docs: number; workItems: number }, void>({
      query: () => "users/stats/me",
    }),
  }),
});

export const { useGetUsersQuery, useGetUserQuery, useGetUserStatsQuery } = userApi;
