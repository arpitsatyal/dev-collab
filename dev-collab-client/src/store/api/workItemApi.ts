import { WorkItem, WorkItemStatus, WorkItemCreateData, WorkItemSuggestion } from "../../types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { WorkItemService } from "../../services/workItem.service";

export const workItemApi = createApi({
  reducerPath: "workItemApi",
  baseQuery: baseQuery,
  tagTypes: ["WorkItems"],
  endpoints: (builder) => ({
    getWorkItemsForWorkspace: builder.query<WorkItem[], string>({
      query: (id) => `work-items?workspaceId=${id}`,
      providesTags: (result) =>
        result ? [{ type: "WorkItems", id: "LIST" }] : [],
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
      async onQueryStarted(
        { workspaceId, workItem },
        { dispatch, queryFulfilled },
      ) {
        const optimisticWorkItem = WorkItemService.createOptimisticWorkItem(workItem, workspaceId);

        // Optimistically update the workItem list cache
        const patchResult = dispatch(
          workItemApi.util.updateQueryData(
            "getWorkItemsForWorkspace",
            workspaceId,
            (draft) => {
              draft.push(optimisticWorkItem);
            },
          ),
        );

        try {
          const { data: createdWorkItem } = await queryFulfilled;

          // Replace the optimistic workItem with the real one from server
          dispatch(
            workItemApi.util.updateQueryData(
              "getWorkItemsForWorkspace",
              workspaceId,
              (draft) => {
                const index = draft.findIndex((t) => t.id === optimisticWorkItem.id);
                if (index !== -1) {
                  draft[index] = createdWorkItem;
                }
              },
            ),
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
      query: ({ workItemId, newStatus }) => ({
        url: `work-items/${workItemId}/status`,
        method: "PATCH",
        body: { newStatus },
      }),
      invalidatesTags: [{ type: "WorkItems", id: "LIST" }],
    }),
    suggestWorkItems: builder.query<{ suggestions: WorkItemSuggestion[] }, string>({
      query: (workspaceId) =>
        `ai/suggest-work-items?workspaceId=${workspaceId}`,
    }),
  }),
});

export const {
  useGetWorkItemsForWorkspaceQuery,
  useCreateWorkItemMutation,
  useUpdateStatusMutation,
  useSuggestWorkItemsQuery,
} = workItemApi;
