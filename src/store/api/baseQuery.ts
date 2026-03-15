import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/api`,
  prepareHeaders: (headers) => {
    // Add any global headers here
    return headers;
  },
  credentials: 'include',
});
