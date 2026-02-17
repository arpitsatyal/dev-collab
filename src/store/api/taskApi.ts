import { Task, TaskStatus } from "@prisma/client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TaskCreateData } from "../../pages/api/tasks";
import dayjs from "dayjs";

export const taskApi = createApi({
  reducerPath: "taskApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Tasks"],
  endpoints: (builder) => ({
    getTasksForProject: builder.query<Task[], string>({
      query: (id) => `tasks?projectId=${id}`,
      providesTags: (result) => (result ? [{ type: "Tasks", id: "LIST" }] : []),
    }),
    createTask: builder.mutation<
      Task,
      { projectId: string; task: TaskCreateData }
    >({
      query: ({ projectId, task }) => ({
        url: `tasks?projectId=${projectId}`,
        method: "POST",
        body: task,
      }),
      async onQueryStarted({ projectId, task }, { dispatch, queryFulfilled }) {
        const tempId = Math.random().toString(36).substring(2, 15);
        const now = dayjs().toDate();

        // Optimistically update the task list cache
        const patchResult = dispatch(
          taskApi.util.updateQueryData(
            "getTasksForProject",
            projectId,
            (draft) => {
              draft.push({
                ...task,
                id: tempId,
                createdAt: now,
                updatedAt: now,
                authorId: "",
              });
            }
          )
        );

        try {
          const { data: createdTask } = await queryFulfilled;

          // Replace the optimistic task with the real one from server
          dispatch(
            taskApi.util.updateQueryData(
              "getTasksForProject",
              projectId,
              (draft) => {
                const index = draft.findIndex((t) => t.id === tempId);
                if (index !== -1) {
                  draft[index] = createdTask;
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
      Task,
      {
        projectId: string;
        taskId: string;
        newStatus: TaskStatus;
      }
    >({
      query: ({ projectId, taskId, newStatus }) => ({
        url: `tasks?projectId=${projectId}&taskId=${taskId}`,
        method: "PATCH",
        body: { newStatus },
      }),
      invalidatesTags: [{ type: "Tasks", id: "LIST" }],
    }),
    suggestWorkItems: builder.query<{ suggestions: any[] }, string>({
      query: (projectId) => `ai/suggest-work-items?projectId=${projectId}`,
    }),
  }),
});

export const {
  useGetTasksForProjectQuery,
  useCreateTaskMutation,
  useUpdateStatusMutation,
  useSuggestWorkItemsQuery,
} = taskApi;
