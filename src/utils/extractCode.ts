export function extractCode(raw?: any): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === "object" || typeof parsed === "string") {
      return parsed;
    }
  } catch (e) {
    // If parsing fails, return raw string (fallback)
    return raw;
  }

  return raw;
}
