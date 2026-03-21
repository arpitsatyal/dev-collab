import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

export const aiApi = createApi({
    reducerPath: "aiApi",
    baseQuery: baseQuery,
    endpoints: (builder) => ({
        generateImplementationPlan: builder.mutation<
            { plan: string },
            { workItemId: string }
        >({
            query: ({ workItemId }: { workItemId: string }) => ({
                url: `ai/analyze-work-item?workItemId=${workItemId}`,
                method: "POST", // Controller has @Post
            }),
        }),
        suggestSnippetFilename: builder.mutation<
            { fileName: string },
            { workspaceId: string; code: string; language?: string }
        >({
            query: ({ workspaceId, code, language }: { workspaceId: string; code: string; language?: string }) => ({
                url: `ai/suggest-snippet-filename?workspaceId=${workspaceId}`,
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
