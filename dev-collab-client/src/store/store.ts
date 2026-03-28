import { configureStore } from "@reduxjs/toolkit";
import { workspaceApi } from "./api/workspaceApi";
import snippetReducer from "./slices/snippetSlice";
import workspaceReducer from "./slices/workspaceSlice";
import { snippetApi } from "./api/snippetApi";
import { userApi } from "./api/userApi";
import { workItemApi } from "./api/workItemApi";
import { docsApi } from "./api/docsApi";
import { aiApi } from "./api/aiApi";
import { chatApi } from "./api/chatApi";

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    [workspaceApi.reducerPath]: workspaceApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [workItemApi.reducerPath]: workItemApi.reducer,
    [docsApi.reducerPath]: docsApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    snippet: snippetReducer,
    [snippetApi.reducerPath]: snippetApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      workspaceApi.middleware,
      snippetApi.middleware,
      userApi.middleware,
      workItemApi.middleware,
      docsApi.middleware,
      aiApi.middleware,
      chatApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
