import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { SnippetCreate } from "../../interfaces";
import { Snippet } from "@prisma/client";

export const snippetApi = createApi({
  reducerPath: "snippetApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Snippets"],

  endpoints: (builder) => ({
    getSnippets: builder.query<Snippet[], { projectId: string }>({
      query: ({ projectId }) => `snippets?projectId=${projectId}`,
    }),

    getSnippet: builder.query<
      Snippet,
      { projectId: string; snippetId: string }
    >({
      query: ({ projectId, snippetId }) =>
        `snippets?projectId=${projectId}&snippetId=${snippetId}`,
    }),

    createSnippet: builder.mutation<
      Snippet,
      { projectId: string; snippet: SnippetCreate }
    >({
      query: ({ projectId, snippet }) => ({
        url: `snippets?projectId=${projectId}`,
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
        url: `snippets?projectId=${projectId}&snippetId=${snippetId}`,
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
