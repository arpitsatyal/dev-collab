
// Map of common extensions to Monaco Editor language IDs
// Reference: https://github.com/microsoft/monaco-languages
export const extensionToLanguageMap: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  java: "java",
  c: "cpp", // Monaco uses 'cpp' for C/C++
  cpp: "cpp",
  cs: "csharp",
  go: "go",
  php: "php",
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  json: "json",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  dockerfile: "dockerfile",
  tf: "hcl", // Terraform often uses HCL or a specific plugin
  hcl: "hcl",
  rs: "rust",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  dart: "dart",
  lua: "lua",
  pl: "perl",
  r: "r",
  scala: "scala",
  toml: "ini", // TOML not natively supported, fallback to INI
  ini: "ini",
  bat: "bat",
  ps1: "powershell",
};

export const languageToExtensionMap: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  ruby: "rb",
  java: "java",
  cpp: "cpp",
  c: "c",
  csharp: "cs",
  go: "go",
  php: "php",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  xml: "xml",
  yaml: "yml",
  markdown: "md",
  sql: "sql",
  shell: "sh",
  dockerfile: "dockerfile",
  hcl: "hcl",
  rust: "rs",
  swift: "swift",
  kotlin: "kt",
  dart: "dart",
  lua: "lua",
  perl: "pl",
  r: "r",
  scala: "scala",
  ini: "ini",
  bat: "bat",
  powershell: "ps1",
  plaintext: "txt",
  text: "txt",
};

export function getLanguageFromExtension(extension: string | undefined | null): string {
  if (!extension) return "plaintext";

  const cleanExt = extension.startsWith('.') ? extension.slice(1) : extension;
  return extensionToLanguageMap[cleanExt.toLowerCase()] || "plaintext";
}

export function getExtensionFromLanguage(
  language: string | undefined | null
): string {
  if (!language) return "txt";
  return languageToExtensionMap[language.toLowerCase()] || "txt";
}

// Keep the old array for backward compatibility if needed, 
// or derived from the map if iterating is necessary
export const languageMapper = Object.entries(extensionToLanguageMap).map(([ext, lang]) => ({
  name: lang,
  extension: ext
}));
