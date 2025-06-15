export function extractCode(raw?: any): string {
  if (!raw) return "";
  const parsed = JSON.parse(raw);

  if (typeof parsed === "object" || typeof parsed === "string") {
    return parsed;
  }

  return raw;
}
