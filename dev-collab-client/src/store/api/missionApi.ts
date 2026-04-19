import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

export interface Mission {
  id: string;
  goal: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  steps?: MissionStep[];
  logs?: string;
}

export interface MissionStep {
  id: string;
  missionId: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  logs?: string;
}

export const missionApi = createApi({
  reducerPath: "missionApi",
  baseQuery: baseQuery,
  tagTypes: ["Mission"],
  endpoints: (builder) => ({
    getMissions: builder.query<Mission[], string>({
      query: (workspaceId) => `missions/workspace/${workspaceId}`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: "Mission" as const, id })),
            { type: "Mission", id: "LIST" },
          ]
          : [{ type: "Mission", id: "LIST" }],
    }),
    getMission: builder.query<Mission, string>({
      query: (id) => `missions/${id}`,
      providesTags: (result, error, id) => [{ type: "Mission", id }],
    }),
    createMission: builder.mutation<Mission, { workspaceId: string; goal: string }>({
      query: (body) => ({
        url: "missions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Mission", id: "LIST" }],
    }),
  }),
});

export const {
  useGetMissionsQuery,
  useGetMissionQuery,
  useCreateMissionMutation,
} = missionApi;
