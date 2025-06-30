import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Doc } from "@prisma/client";
import { DocCreateData } from "../../pages/api/docs";

export const docsApi = createApi({
  reducerPath: "docsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Docs"],

  endpoints: (builder) => ({
    getDocs: builder.query<Doc[], { projectId: string }>({
      query: ({ projectId }) => `docs?projectId=${projectId}`,
      providesTags: (result, error, { projectId }) =>
        result ? [{ type: "Docs", id: projectId }] : [],
    }),

    createDoc: builder.mutation<Doc, { projectId: string; doc: DocCreateData }>(
      {
        query: ({ projectId, doc }) => ({
          url: `docs?projectId=${projectId}`,
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
        url: `docs?projectId=${projectId}&docId=${docId}`,
        method: "PATCH",
        body: doc,
      }),
    }),
  }),
});

export const { useGetDocsQuery, useCreateDocMutation, useEditDocMutation } =
  docsApi;
