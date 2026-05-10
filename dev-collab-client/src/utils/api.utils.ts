/**
 * Utilities for API request construction.
 */

export const ApiUtils = {
  /**
   * Safely builds a query string from a record of params.
   * Filters out null, undefined, and 'null'/'undefined' strings.
   */
  buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== null && 
        value !== undefined && 
        value !== "null" && 
        value !== "undefined"
      ) {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : "";
  }
};
