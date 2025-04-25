import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Snippet, SnippetCreate } from "../../interfaces";

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
      providesTags: (result, error, { projectId, snippetId }) => [
        { type: "Snippets", id: `${projectId}-${snippetId}` },
      ],
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
      invalidatesTags: (result, error, { projectId, snippetId }) => [
        { type: "Snippets", id: `${projectId}-${snippetId}` },
      ],
    }),
  }),
});

export const {
  useGetSnippetsQuery,
  useGetSnippetQuery,
  useCreateSnippetMutation,
  useEditSnippetMutation,
} = snippetApi;
