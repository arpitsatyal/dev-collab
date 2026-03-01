import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const aiApi = createApi({
    reducerPath: "aiApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api/ai/" }),
    endpoints: (builder) => ({
        generateImplementationPlan: builder.mutation<
            { plan: string },
            { taskId: string }
        >({
            query: ({ taskId }) => ({
                url: `analyze-work-item?taskId=${taskId}`,
                method: "GET", // RTK Query mutations can still make GET requests if they cause side-effects like DB caching
            }),
        }),
    }),
});

export const { useGenerateImplementationPlanMutation } = aiApi;
