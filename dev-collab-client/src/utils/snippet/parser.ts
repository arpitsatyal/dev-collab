export const parseFilename = (
  filename: string
): { title: string; extension: string } | null => {
  const trimmed = filename.trim();
  const match = trimmed.match(/^([a-zA-Z0-9._-]+)\.([a-zA-Z0-9]+)$/);
  if (!match) {
    return null;
  }

  return {
    title: match[1],
    extension: match[2].toLowerCase(),
  };
};
