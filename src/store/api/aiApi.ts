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
        suggestSnippetFilename: builder.mutation<
            { fileName: string },
            { projectId: string; code: string; language?: string }
        >({
            query: ({ projectId, code, language }) => ({
                url: "suggest-snippet-filename",
                method: "POST",
                body: { projectId, code, language },
            }),
        }),
    }),
});

export const {
    useGenerateImplementationPlanMutation,
    useSuggestSnippetFilenameMutation,
} = aiApi;
