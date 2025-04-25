import { useRouter } from "next/router";
import { Snippet } from "../interfaces";
import { NavLink } from "@mantine/core";
import { IconFile, IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";

const SnippetList = ({ snippets }: { snippets: Snippet[] }) => {
  const router = useRouter();
  const pathParts = router.asPath.split("/");
  const snippetId = pathParts[4];

  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    if (pathParts[4] === "create") {
      setActiveItem("create");
    } else if (pathParts[3] === "snippets") {
      setActiveItem(snippetId);
    } else {
      setActiveItem(null);
    }
  }, [router.asPath]);

  const handleCreateClick = () => {
    const createPath = `/projects/${router.query.projectId}/snippets/create`;
    setActiveItem("create");
    router.push(createPath);
  };

  const handleSnippetClick = (snippetId: string, path: string) => {
    setActiveItem(snippetId);
    router.push(path);
  };

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
  const getSnippetName = (snippet: Snippet) => {
    if (!snippet.title) return "";
    const language = languageMapper.find(
      (lang) => snippet.language === lang.name
    );
    if (!language) return;
    return `${snippet.title}.${language.extension}`;
  };

  return (
    <>
      <NavLink
        label="Create Snippet"
        onClick={handleCreateClick}
        leftSection={<IconPlus size={16} />}
        active={activeItem === "create"}
      />

      {snippets.length ? (
        snippets.map((snippet) => (
          <NavLink
            key={snippet.id}
            label={getSnippetName(snippet)}
            leftSection={<IconFile size={16} />}
            active={activeItem === snippet.id}
            opened={activeItem === snippet.id}
            onClick={() =>
              handleSnippetClick(
                snippet.id,
                `/projects/${snippet.projectId}/snippets/${snippet.id}`
              )
            }
          />
        ))
      ) : (
        <></>
      )}
    </>
  );
};

export default SnippetList;
