export function getSingleQueryParam(param: unknown): string | undefined {
  if (Array.isArray(param)) {
    return param[0];
  }
  return typeof param === "string" ? param : undefined;
}
