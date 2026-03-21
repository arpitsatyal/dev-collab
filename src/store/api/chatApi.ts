import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { Chat, Message } from "../../types";

export type ChatWithMessages = Chat & { messages?: Message[] };

export const chatApi = createApi({
    reducerPath: "chatApi",
    baseQuery: baseQuery,
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
            query: (chatId) => `chats/${chatId}`,
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
                url: `chats/${chatId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, chatId) => [
                { type: "Chat", id: chatId },
                { type: "Chat", id: "LIST" },
            ],
        }),
        askAI: builder.mutation<
            { answer: string },
            { chatId: string; question: string; workspaceId: string }
        >({
            query: ({ chatId, question, workspaceId }) => ({
                url: `ai/ask?chatId=${chatId}&workspaceId=${workspaceId}`,
                method: "POST",
                body: { question },
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
