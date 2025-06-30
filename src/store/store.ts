import { configureStore } from "@reduxjs/toolkit";
import { projectApi } from "./api/projectApi";
import snippetReducer from "./slices/snippetSlice";
import projectReducer from "./slices/projectSlice";
import { snippetApi } from "./api/snippetApi";
import { userApi } from "./api/userApi";
import { taskApi } from "./api/taskApi";
import { docsApi } from "./api/docsApi";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [docsApi.reducerPath]: docsApi.reducer,
    snippet: snippetReducer,
    [snippetApi.reducerPath]: snippetApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      projectApi.middleware,
      snippetApi.middleware,
      userApi.middleware,
      taskApi.middleware,
      docsApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
