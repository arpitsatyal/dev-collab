import { Snippet } from "@prisma/client";

const languageMapper = [
  {
    name: "javascript",
    extension: "js",
  },
  {
    name: "typescript",
    extension: "ts",
  },
  {
    name: "python",
    extension: "py",
  },
  {
    name: "html",
    extension: "html",
  },
  {
    name: "json",
    extension: "json",
  },
];

export const getFileName = (snippet: Snippet) => {
  if (!snippet.title) return "";
  const language = languageMapper.find(
    (lang) => snippet.language === lang.name
  );
  if (!language) return "";

  return `${snippet.title}.${language.extension}`;
};
