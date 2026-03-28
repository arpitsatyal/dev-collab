import { WorkItem, WorkItemStatus, WorkItemCreateData } from "../../types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import dayjs from "dayjs";

export const workItemApi = createApi({
  reducerPath: "workItemApi",
  baseQuery: baseQuery,
  tagTypes: ["WorkItems"],
  endpoints: (builder) => ({
    getWorkItemsForWorkspace: builder.query<WorkItem[], string>({
      query: (id) => `work-items?workspaceId=${id}`,
      providesTags: (result) => (result ? [{ type: "WorkItems", id: "LIST" }] : []),
    }),
    createWorkItem: builder.mutation<
      WorkItem,
      { workspaceId: string; workItem: WorkItemCreateData }
    >({
      query: ({ workspaceId, workItem }) => ({
        url: `work-items?workspaceId=${workspaceId}`,
        method: "POST",
        body: workItem,
      }),
      async onQueryStarted({ workspaceId, workItem }, { dispatch, queryFulfilled }) {
        const tempId = Math.random().toString(36).substring(2, 15);
        const now = dayjs().toDate();

        const { snippetIds, ...workItemFields } = workItem;

        // Optimistically update the workItem list cache
        const patchResult = dispatch(
          workItemApi.util.updateQueryData(
            "getWorkItemsForWorkspace",
            workspaceId,
            (draft) => {
              draft.push({
                ...workItemFields,
                workspaceId: workspaceId,
                id: tempId,
                createdAt: now,
                updatedAt: now,
                authorId: null,
                aiPlan: null,
              } as any);
            }
          )
        );

        try {
          const { data: createdWorkItem } = await queryFulfilled;

          // Replace the optimistic workItem with the real one from server
          dispatch(
            workItemApi.util.updateQueryData(
              "getWorkItemsForWorkspace",
              workspaceId,
              (draft) => {
                const index = draft.findIndex((t) => t.id === tempId);
                if (index !== -1) {
                  draft[index] = createdWorkItem;
                }
              }
            )
          );
        } catch {
          // Rollback on failure
          patchResult.undo();
        }
      },
    }),

    updateStatus: builder.mutation<
      WorkItem,
      {
        workspaceId: string;
        workItemId: string;
        newStatus: WorkItemStatus;
      }
    >({
      query: ({ workspaceId, workItemId, newStatus }) => ({
        url: `work-items/${workItemId}/status`,
        method: "PATCH",
        body: { newStatus },
      }),
      invalidatesTags: [{ type: "WorkItems", id: "LIST" }],
    }),
    suggestWorkItems: builder.query<{ suggestions: any[] }, string>({
      query: (workspaceId) => `ai/suggest-work-items?workspaceId=${workspaceId}`,
    }),
  }),
});

export const {
  useGetWorkItemsForWorkspaceQuery,
  useCreateWorkItemMutation,
  useUpdateStatusMutation,
  useSuggestWorkItemsQuery,
} = workItemApi;
