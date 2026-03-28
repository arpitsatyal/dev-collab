import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { uniqBy } from "lodash";
import { WorkspaceWithPin } from "../../types";
import { RootState } from "../store";

export const workspaceApi = createApi({
  reducerPath: "workspaceApi",
  baseQuery: baseQuery,
  tagTypes: ["Workspaces", "Workspace"],
  endpoints: (builder) => ({
    getWorkspaces: builder.query<
      { items: WorkspaceWithPin[]; hasMore: boolean },
      { skip: number; limit: number }
    >({
      query: ({ skip, limit }) => `workspaces?skip=${skip}&take=${limit}`,
      transformResponse: (response: WorkspaceWithPin[], meta, arg) => ({
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
                ({ id }) => ({ type: "Workspace", id }) as const,
              ),
              { type: "Workspaces", id: "LIST" },
            ]
          : [{ type: "Workspaces", id: "LIST" }],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getWorkspaceById: builder.query<WorkspaceWithPin, string>({
      query: (id) => `workspaces/${id}`,
      providesTags: (result, error, id) => [{ type: "Workspace", id }],
    }),
    createWorkspace: builder.mutation<WorkspaceWithPin, Partial<WorkspaceWithPin>>({
      query: (workspace) => ({
        url: "workspaces",
        method: "POST",
        body: workspace,
      }),
      invalidatesTags: [{ type: "Workspaces", id: "LIST" }],
    }),
    updatePinnedStatus: builder.mutation<
      WorkspaceWithPin,
      { workspaceId: string; isPinned: boolean }
    >({
      query: ({ workspaceId, isPinned }) => ({
        url: `workspaces/${workspaceId}`,
        method: "PATCH",
        body: { isPinned },
      }),
      async onQueryStarted(
        { workspaceId, isPinned },
        { dispatch, getState, queryFulfilled },
      ) {
        const state = getState() as RootState;
        const { skip, pageSize } = state.workspace;

        const patchResult = dispatch(
          workspaceApi.util.updateQueryData(
            "getWorkspaces",
            { skip, limit: pageSize },
            (draft) => {
              const item = draft.items.find(
                (p: WorkspaceWithPin) => p.id === workspaceId,
              );
              if (item) {
                item.isPinned = isPinned;

                draft.items.sort((a: WorkspaceWithPin, b: WorkspaceWithPin) => {
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
            workspaceApi.endpoints.getWorkspaces.initiate(
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
    importWorkspace: builder.mutation<
      { workspace: any; stats: { snippets: number; docs: number } },
      { url: string; selectedFiles: string[] }
    >({
      query: (body) => ({
        url: "workspaces/import",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Workspaces", id: "LIST" }],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useGetWorkspaceByIdQuery,
  useCreateWorkspaceMutation,
  useUpdatePinnedStatusMutation,
  useGetRepoTreeQuery,
  useImportWorkspaceMutation,
} = workspaceApi;
