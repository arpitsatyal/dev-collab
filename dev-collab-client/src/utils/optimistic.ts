/**
 * Utilities for handling optimistic UI updates.
 */

export const OptimisticUtils = {
  /**
   * Generates a temporary ID for optimistic UI items.
   */
  generateTempId(): string {
    return Math.random().toString(36).substring(2, 15);
  },

  /**
   * Returns a fresh date for optimistic timestamps.
   */
  now(): Date {
    return new Date();
  }
};
