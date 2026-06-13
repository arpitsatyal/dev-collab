/**
 * Centralized application configuration.
 * Avoids hardcoding environment variable fallbacks across the codebase.
 */

export const CONFIG = {
  API_BASE_URL: typeof window === "undefined" 
    ? process.env.NEXT_PUBLIC_API_GATEWAY_URL 
    : (process.env.NEXT_PUBLIC_API_URL || ""),
  // Add other shared config here
} as const;
