import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

export const aiApi = createApi({
    reducerPath: "aiApi",
    baseQuery: baseQuery,
    endpoints: (builder) => ({
        generateImplementationPlan: builder.mutation<
            { plan: string },
            { taskId: string }
        >({
            query: ({ taskId }: { taskId: string }) => ({
                url: `ai/analyze-work-item?workItemId=${taskId}`,
                method: "POST", // Controller has @Post
            }),
        }),
        suggestSnippetFilename: builder.mutation<
            { fileName: string },
            { projectId: string; code: string; language?: string }
        >({
            query: ({ projectId, code, language }: { projectId: string; code: string; language?: string }) => ({
                url: `ai/suggest-snippet-filename?workspaceId=${projectId}`,
                method: "POST",
                body: { code, language },
            }),
        }),
    }),
});

export const {
    useGenerateImplementationPlanMutation,
    useSuggestSnippetFilenameMutation,
} = aiApi;
