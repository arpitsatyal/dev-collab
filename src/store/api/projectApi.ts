import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Project } from "../../interfaces";

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Projects"],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => "projects",
      providesTags: (result) =>
        result ? [{ type: "Projects", id: "LIST" }] : [],
    }),
    getProject: builder.query<Project, string>({
      query: (id) => `projects?projectId=${id}`,
    }),
    createProject: builder.mutation<Project, Partial<Project>>({
      query: (newProject) => ({
        url: "projects",
        method: "POST",
        body: newProject,
      }),
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
} = projectApi;
