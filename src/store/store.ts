import { configureStore } from "@reduxjs/toolkit";
import { projectApi } from "./api/projectApi";
import projectReducer from "./slices/projectSlice";
import snippetReducer from "./slices/snippetSlice";
import { snippetApi } from "./api/snippetApi";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    [projectApi.reducerPath]: projectApi.reducer,

    snippet: snippetReducer,
    [snippetApi.reducerPath]: snippetApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(projectApi.middleware, snippetApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
