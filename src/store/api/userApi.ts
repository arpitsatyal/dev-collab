import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "users",
      providesTags: (result) => (result ? [{ type: "Users", id: "LIST" }] : []),
    }),
    getUser: builder.query<User, string>({
      query: (id) => `users?userId=${id}`,
    }),
    getUserStats: builder.query<{ workspaces: number; snippets: number; docs: number; workItems: number }, void>({
      query: () => "users/stats",
    }),
  }),
});

export const { useGetUsersQuery, useGetUserQuery, useGetUserStatsQuery } = userApi;
