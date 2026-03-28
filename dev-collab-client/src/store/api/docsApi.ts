import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { Doc } from "../../types";
import { DocCreateData } from "../../types";

export const docsApi = createApi({
  reducerPath: "docsApi",
  baseQuery: baseQuery,
  tagTypes: ["Docs"],

  endpoints: (builder) => ({
    getDocs: builder.query<Doc[], { workspaceId: string }>({
      query: ({ workspaceId }) => `workspaces/${workspaceId}/docs`,
      providesTags: (result, error, { workspaceId }) =>
        result ? [{ type: "Docs", id: workspaceId }] : [],
    }),

    createDoc: builder.mutation<Doc, { workspaceId: string; doc: DocCreateData }>(
      {
        query: ({ workspaceId, doc }) => ({
          url: `workspaces/${workspaceId}/docs`,
          method: "POST",
          body: doc,
        }),
        invalidatesTags: (result, error, { workspaceId }) => [
          { type: "Docs", id: workspaceId },
        ],
      }
    ),

    editDoc: builder.mutation<
      Doc,
      {
        workspaceId: string;
        doc: Partial<Doc>;
        docId: string;
      }
    >({
      query: ({ workspaceId, doc, docId }) => ({
        url: `workspaces/${workspaceId}/docs/${docId}`,
        method: "PATCH",
        body: doc,
      }),
    }),
  }),
});

export const { useGetDocsQuery, useCreateDocMutation, useEditDocMutation } =
  docsApi;
