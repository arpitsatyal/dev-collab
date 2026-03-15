import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { Snippet } from "@prisma/client";
import { SnippetsCreateData } from "../../pages/api/snippets";

export const snippetApi = createApi({
  reducerPath: "snippetApi",
  baseQuery: baseQuery,
  tagTypes: ["Snippets"],

  endpoints: (builder) => ({
    getSnippets: builder.query<Snippet[], { projectId: string }>({
      query: ({ projectId }) => `workspaces/${projectId}/snippets`,
    }),

    getSnippet: builder.query<
      Snippet,
      { projectId: string; snippetId: string }
    >({
      query: ({ projectId, snippetId }) =>
        `workspaces/${projectId}/snippets/${snippetId}`,
    }),

    createSnippet: builder.mutation<
      Snippet,
      { projectId: string; snippet: Omit<SnippetsCreateData, "authorId"> }
    >({
      query: ({ projectId, snippet }) => ({
        url: `workspaces/${projectId}/snippets`,
        method: "POST",
        body: snippet,
      }),
    }),

    editSnippet: builder.mutation<
      Snippet,
      {
        projectId: string;
        snippet: Partial<Snippet>;
        snippetId: string;
      }
    >({
      query: ({ projectId, snippet, snippetId }) => ({
        url: `workspaces/${projectId}/snippets/${snippetId}`,
        method: "PATCH",
        body: snippet,
      }),
    }),
  }),
});

export const {
  useLazyGetSnippetsQuery,
  useGetSnippetQuery,
  useCreateSnippetMutation,
  useEditSnippetMutation,
} = snippetApi;
