import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { uniqBy } from "lodash";
import { ProjectWithPin } from "../../types";
import { RootState } from "../store";

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Projects", "Project"],
  endpoints: (builder) => ({
    getProjects: builder.query<
      { items: ProjectWithPin[]; hasMore: boolean },
      { skip: number; limit: number }
    >({
      query: ({ skip, limit }) => `projects?skip=${skip}&limit=${limit}`,
      transformResponse: (response: ProjectWithPin[], meta, arg) => ({
        items: response,
        hasMore: response.length === arg.limit,
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newData) => {
        currentCache.items = uniqBy(
          [...(currentCache.items || []), ...newData.items],
          "id"
        );
        currentCache.hasMore = newData.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.skip !== previousArg?.skip,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(
                ({ id }) => ({ type: "Project", id } as const)
              ),
              { type: "Projects", id: "LIST" },
            ]
          : [{ type: "Projects", id: "LIST" }],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getProjectById: builder.query<ProjectWithPin, string>({
      query: (id) => `projects?projectId=${id}`,
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),
    createProject: builder.mutation<ProjectWithPin, Partial<ProjectWithPin>>({
      query: (project) => ({
        url: "projects",
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
        url: `projects?projectId=${projectId}`,
        method: "PATCH",
        body: { isPinned },
      }),
      async onQueryStarted(
        { projectId, isPinned },
        { dispatch, getState, queryFulfilled }
      ) {
        const state = getState() as RootState;
        const { skip, pageSize } = state.project;

        const patchResult = dispatch(
          projectApi.util.updateQueryData(
            "getProjects",
            { skip, limit: pageSize },
            (draft) => {
              const item = draft.items.find((p) => p.id === projectId);
              if (item) {
                item.isPinned = isPinned;

                draft.items.sort((a, b) => {
                  if (a.isPinned !== b.isPinned) {
                    return a.isPinned ? -1 : 1;
                  }
                  return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                });
              }
            }
          )
        );

        try {
          await queryFulfilled;

          dispatch(
            projectApi.endpoints.getProjects.initiate(
              { skip, limit: pageSize },
              { forceRefetch: true }
            )
          );
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdatePinnedStatusMutation,
} = projectApi;
