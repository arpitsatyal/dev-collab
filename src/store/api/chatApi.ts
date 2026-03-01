import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Chat, Message } from "@prisma/client";

export type ChatWithMessages = Chat & { messages?: Message[] };

export const chatApi = createApi({
    reducerPath: "chatApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
    tagTypes: ["Chat"],
    endpoints: (builder) => ({
        getChats: builder.query<ChatWithMessages[], void>({
            query: () => "chats",
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: "Chat" as const, id })), { type: "Chat", id: "LIST" }]
                    : [{ type: "Chat", id: "LIST" }],
        }),
        getChat: builder.query<ChatWithMessages, string>({
            query: (chatId) => `chats?chatId=${chatId}`,
            providesTags: (result, error, chatId) => [{ type: "Chat", id: chatId }],
        }),
        createChat: builder.mutation<Chat, void>({
            query: () => ({
                url: "chats",
                method: "POST",
            }),
            invalidatesTags: [{ type: "Chat", id: "LIST" }],
        }),
        deleteChat: builder.mutation<void, string>({
            query: (chatId) => ({
                url: `chats?id=${chatId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, chatId) => [
                { type: "Chat", id: chatId },
                { type: "Chat", id: "LIST" },
            ],
        }),
        askAI: builder.mutation<
            { answer: string },
            { chatId: string; question: string; projectId: string }
        >({
            query: ({ chatId, question, projectId }) => ({
                url: `ai/ask?chatId=${chatId}`,
                method: "POST",
                body: { question, projectId },
            }),
            invalidatesTags: (result, error, { chatId }) => [{ type: "Chat", id: chatId }],
        }),
    }),
});

export const {
    useGetChatsQuery,
    useGetChatQuery,
    useCreateChatMutation,
    useDeleteChatMutation,
    useAskAIMutation,
} = chatApi;
