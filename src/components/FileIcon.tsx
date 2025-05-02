import { Snippet } from "@prisma/client";
import {
  IconBrandHtml5,
  IconBrandJavascript,
  IconBrandPython,
  IconBrandTypescript,
  IconFile,
} from "@tabler/icons-react";

const FileIcon = ({ snippet }: { snippet: Snippet }) => {
  if (!snippet?.language) {
    return <IconFile size={16} />;
  }

  switch (snippet.language.toLowerCase()) {
    case "javascript":
      return <IconBrandJavascript size={24} />;
    case "typescript":
      return <IconBrandTypescript size={24} />;
    case "python":
      return <IconBrandPython size={24} />;
    case "html":
      return <IconBrandHtml5 size={24} />;
    default:
      return <IconFile size={24} />;
  }
};

export default FileIcon;
