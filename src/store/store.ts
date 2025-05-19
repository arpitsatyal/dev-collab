import { configureStore } from "@reduxjs/toolkit";
import { projectApi } from "./api/projectApi";
import projectReducer from "./slices/projectSlice";
import snippetReducer from "./slices/snippetSlice";
import userReducer from "./slices/userSlice";
import { snippetApi } from "./api/snippetApi";
import { userApi } from "./api/userApi";
import { taskApi } from "./api/taskApi";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    [projectApi.reducerPath]: projectApi.reducer,

    snippet: snippetReducer,
    [snippetApi.reducerPath]: snippetApi.reducer,

    user: userReducer,
    [userApi.reducerPath]: userApi.reducer,

    task: userReducer,
    [taskApi.reducerPath]: taskApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      projectApi.middleware,
      snippetApi.middleware,
      userApi.middleware,
      taskApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
