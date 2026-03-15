import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { Doc } from "@prisma/client";
import { DocCreateData } from "../../pages/api/docs";

export const docsApi = createApi({
  reducerPath: "docsApi",
  baseQuery: baseQuery,
  tagTypes: ["Docs"],

  endpoints: (builder) => ({
    getDocs: builder.query<Doc[], { projectId: string }>({
      query: ({ projectId }) => `workspaces/${projectId}/docs`,
      providesTags: (result, error, { projectId }) =>
        result ? [{ type: "Docs", id: projectId }] : [],
    }),

    createDoc: builder.mutation<Doc, { projectId: string; doc: DocCreateData }>(
      {
        query: ({ projectId, doc }) => ({
          url: `workspaces/${projectId}/docs`,
          method: "POST",
          body: doc,
        }),
        invalidatesTags: (result, error, { projectId }) => [
          { type: "Docs", id: projectId },
        ],
      }
    ),

    editDoc: builder.mutation<
      Doc,
      {
        projectId: string;
        doc: Partial<Doc>;
        docId: string;
      }
    >({
      query: ({ projectId, doc, docId }) => ({
        url: `workspaces/${projectId}/docs/${docId}`,
        method: "PATCH",
        body: doc,
      }),
    }),
  }),
});

export const { useGetDocsQuery, useCreateDocMutation, useEditDocMutation } =
  docsApi;
