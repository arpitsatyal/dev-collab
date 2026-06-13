/**
 * Validates a single URL parameter (string and non-empty).
 */
export const isValidParam = (param: any): param is string => {
  return typeof param === "string" && param.trim() !== "";
};

/**
 * Validates multiple parameters. Returns true if ALL are valid.
 * Useful for multi-segment routes like /workspaces/[workspaceId]/snippets/[snippetId]
 */
export const isContextReady = (...params: any[]): boolean => {
  return params.every(isValidParam);
};
