import { useRouter } from "next/router";
import { NavLink, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Snippet } from "@prisma/client";
import FileIcon from "../FileIcon";

const SnippetList = ({
  snippets,
  isVisible,
}: {
  snippets: Snippet[];
  isVisible: boolean;
}) => {
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
  }, [router.asPath, pathParts, snippetId]);

  const handleCreateClick = () => {
    const createPath = `/projects/${router.query.projectId}/snippets/create`;
    setActiveItem("create");
    router.push(createPath);
  };

  const handleSnippetClick = (snippetId: string, path: string) => {
    setActiveItem(snippetId);
    router.push(path);
  };

  if (!isVisible) {
    return <></>;
  }

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
            label={
              <Text
                fz="sm"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "150px",
                }}
                title={`${snippet.title}.${snippet.extension ?? ""}`}
              >
                {`${snippet.title}.${snippet.extension ?? ""}`}
              </Text>
            }
            leftSection={<FileIcon snippet={snippet} />}
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
