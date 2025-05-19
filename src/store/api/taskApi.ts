import { Task } from "@prisma/client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TaskCreateData } from "../../pages/api/tasks";

export const taskApi = createApi({
  reducerPath: "taskApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Tasks"],
  endpoints: (builder) => ({
    getTasksForProject: builder.query<Task, string>({
      query: (id) => `tasks?projectId=${id}`,
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
    }),
  }),
});

export const { useGetTasksForProjectQuery, useCreateTaskMutation } = taskApi;
