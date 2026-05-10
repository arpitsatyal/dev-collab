import axios, { AxiosError } from "axios";
import { notifications } from "@mantine/notifications";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Helpful for debugging in development
apiClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const message = data?.message || error.message || "An unexpected error occurred";

    // 1. Handle Authentication Failures
    if (status === 401) {
      // Prevent infinite redirect loops if we're already on the landing page
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    // 2. Global Error Notification
    // We only show notifications for client/server errors (4xx, 5xx)
    if (status && status >= 400) {
      notifications.show({
        title: "API Error",
        message: typeof message === "string" ? message : JSON.stringify(message),
        color: "red",
        autoClose: 5000,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
