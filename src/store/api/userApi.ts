import { User } from "@prisma/client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
  }),
});

export const { useGetUsersQuery, useGetUserQuery } = userApi;
