/**
 * Centralized application configuration.
 * Avoids hardcoding environment variable fallbacks across the codebase.
 */

export const CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  // Add other shared config here
} as const;
