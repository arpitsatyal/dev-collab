import { Project } from "@prisma/client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Projects"],
  endpoints: (builder) => ({
    getProjects: builder.query<
      { items: Project[]; hasMore: boolean },
      { skip: number; limit: number }
    >({
      query: ({ skip, limit }) => `projects?skip=${skip}&limit=${limit}`,
      transformResponse: (response: Project[], meta, arg) => ({
        items: response,
        hasMore: response.length === arg.limit,
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newData) => {
        currentCache.items = [...(currentCache.items || []), ...newData.items];
        currentCache.hasMore = newData.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.skip !== previousArg?.skip,
      providesTags: ["Projects"], // Add tag to enable invalidation
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getProjectById: builder.query<Project, string>({
      query: (id) => `projects?projectId=${id}`,
      providesTags: (result, error, id) => [{ type: "Projects", id }], // Tag for individual project
    }),
    createProject: builder.mutation<Project, Partial<Project>>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"], // Invalidate all Projects queries
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
} = projectApi;
