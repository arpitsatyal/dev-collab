import { useRouter } from "next/router";
import { Snippet } from "../interfaces";
import { NavLink } from "@mantine/core";
import { IconFile, IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";

const SnippetList = ({ snippets }: { snippets: Snippet[] }) => {
  const router = useRouter();

  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    const { pathname } = router;
    if (pathname.includes("/snippets/create")) {
      setActiveItem("create");
    } else if (pathname.includes("/snippets/")) {
      const snippetId = router.query.snippetId as string;
      setActiveItem(snippetId);
    } else {
      setActiveItem(null);
    }
  }, [router.pathname]);

  const handleCreateClick = () => {
    const createPath = `/projects/${router.query.projectId}/snippets/create`;
    setActiveItem("create");
    router.push(createPath);
  };

  const handleSnippetClick = (snippetId: string, path: string) => {
    setActiveItem(snippetId);
    router.push(path);
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
            label={snippet.title}
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
