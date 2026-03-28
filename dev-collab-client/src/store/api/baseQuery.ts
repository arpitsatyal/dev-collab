import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/api`,
  prepareHeaders: (headers) => {
    return headers;
  },
  credentials: 'include',
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // Intercept 401 Unauthorized responses globally
  if (result.error && result.error.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  return result;
};
