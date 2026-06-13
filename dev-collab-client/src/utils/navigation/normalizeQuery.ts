export const normalizeQuery = (query: string) => {
  const uniqueChars = query
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .split("")
    .filter((char, index, self) => self.indexOf(char) === index)
    .join("");
  return uniqueChars.slice(0, 5);
};
