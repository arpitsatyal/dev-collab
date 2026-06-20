export const normalizeBaseName = (name: string): string =>
  (name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

export const inferFallbackBaseName = (code: string): string => {
  const patterns = [
    /function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
    /const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\(/,
    /class\s+([A-Za-z_][A-Za-z0-9_]*)\s*/,
    /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
    /fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match?.[1]) return normalizeBaseName(match[1]);
  }

  const firstContentLine = code
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstContentLine) return "snippet";

  const cleaned = firstContentLine
    .replace(/^[#/*\-\s`]+/, "")
    .replace(/[`'"{}()[\];:,]+/g, " ")
    .trim();

  return normalizeBaseName(cleaned) || "snippet";
};

export const buildUniqueFilename = (
  baseName: string,
  extension: string,
  existingNames: Set<string>,
): string => {
  const safeBase = baseName || "snippet";
  let candidate = `${safeBase}.${extension}`;
  let index = 1;

  while (existingNames.has(candidate.toLowerCase())) {
    candidate = `${safeBase}_${index}.${extension}`;
    index += 1;
  }

  return candidate;
};
