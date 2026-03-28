import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { Snippet } from "../../types";
import { SnippetsCreateData } from "../../types";

export const snippetApi = createApi({
  reducerPath: "snippetApi",
  baseQuery: baseQuery,
  tagTypes: ["Snippets"],

  endpoints: (builder) => ({
    getSnippets: builder.query<Snippet[], { workspaceId: string }>({
      query: ({ workspaceId }) => `workspaces/${workspaceId}/snippets`,
    }),

    getSnippet: builder.query<
      Snippet,
      { workspaceId: string; snippetId: string }
    >({
      query: ({ workspaceId, snippetId }) =>
        `workspaces/${workspaceId}/snippets/${snippetId}`,
    }),

    createSnippet: builder.mutation<
      Snippet,
      { workspaceId: string; snippet: Omit<SnippetsCreateData, "authorId"> }
    >({
      query: ({ workspaceId, snippet }) => ({
        url: `workspaces/${workspaceId}/snippets`,
        method: "POST",
        body: snippet,
      }),
    }),

    editSnippet: builder.mutation<
      Snippet,
      {
        workspaceId: string;
        snippet: Partial<Snippet>;
        snippetId: string;
      }
    >({
      query: ({ workspaceId, snippet, snippetId }) => ({
        url: `workspaces/${workspaceId}/snippets/${snippetId}`,
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
