import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

import { Mission, MissionLog, MissionStep } from "../../types/mission";
export type { Mission, MissionLog, MissionStep };

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
    resumeMission: builder.mutation<Mission, { id: string; action: 'APPROVE' | 'REJECT'; feedback?: string }>({
      query: ({ id, ...body }) => ({
        url: `missions/${id}/resume`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Mission", id }],
    }),
  }),
});

export const {
  useGetMissionsQuery,
  useGetMissionQuery,
  useCreateMissionMutation,
  useResumeMissionMutation,
} = missionApi;
