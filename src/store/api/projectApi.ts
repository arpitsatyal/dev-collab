import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { uniqBy } from "lodash";
import { ProjectWithPin } from "../../types";
import { RootState } from "../store";

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: baseQuery,
  tagTypes: ["Projects", "Project"],
  endpoints: (builder) => ({
    getProjects: builder.query<
      { items: ProjectWithPin[]; hasMore: boolean },
      { skip: number; limit: number }
    >({
      query: ({ skip, limit }) => `workspaces?skip=${skip}&take=${limit}`,
      transformResponse: (response: ProjectWithPin[], meta, arg) => ({
        items: response,
        hasMore: response.length === arg.limit,
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newData) => {
        currentCache.items = uniqBy(
          [...(currentCache.items || []), ...newData.items],
          "id",
        );
        currentCache.hasMore = newData.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.skip !== previousArg?.skip,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(
                ({ id }) => ({ type: "Project", id }) as const,
              ),
              { type: "Projects", id: "LIST" },
            ]
          : [{ type: "Projects", id: "LIST" }],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getProjectById: builder.query<ProjectWithPin, string>({
      query: (id) => `workspaces/${id}`,
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),
    createProject: builder.mutation<ProjectWithPin, Partial<ProjectWithPin>>({
      query: (project) => ({
        url: "workspaces",
        method: "POST",
        body: project,
      }),
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),
    updatePinnedStatus: builder.mutation<
      ProjectWithPin,
      { projectId: string; isPinned: boolean }
    >({
      query: ({ projectId, isPinned }) => ({
        url: `workspaces/${projectId}`,
        method: "PATCH",
        body: { isPinned },
      }),
      async onQueryStarted(
        { projectId, isPinned },
        { dispatch, getState, queryFulfilled },
      ) {
        const state = getState() as RootState;
        const { skip, pageSize } = state.project;

        const patchResult = dispatch(
          projectApi.util.updateQueryData(
            "getProjects",
            { skip, limit: pageSize },
            (draft) => {
              const item = draft.items.find(
                (p: ProjectWithPin) => p.id === projectId,
              );
              if (item) {
                item.isPinned = isPinned;

                draft.items.sort((a: ProjectWithPin, b: ProjectWithPin) => {
                  if (a.isPinned !== b.isPinned) {
                    return a.isPinned ? -1 : 1;
                  }
                  return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                });
              }
            },
          ),
        );

        try {
          await queryFulfilled;

          dispatch(
            projectApi.endpoints.getProjects.initiate(
              { skip, limit: pageSize },
              { forceRefetch: true },
            ),
          );
        } catch {
          patchResult.undo();
        }
      },
    }),
    getRepoTree: builder.query<
      { files: { path: string; size: number }[] },
      string
    >({
      query: (url) => `workspaces/import/tree?url=${encodeURIComponent(url)}`,
    }),
    importProject: builder.mutation<
      { project: any; stats: { snippets: number; docs: number } },
      { url: string; selectedFiles: string[] }
    >({
      query: (body) => ({
        url: "workspaces/import",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdatePinnedStatusMutation,
  useGetRepoTreeQuery,
  useImportProjectMutation,
} = projectApi;
