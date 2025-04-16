import { useRouter } from "next/router";
import { Snippet } from "../interfaces";
import { NavLink } from "@mantine/core";
import { IconFile } from "@tabler/icons-react";

const SnippetList = ({ snippets }: { snippets: Snippet[] }) => {
  const router = useRouter();

  return (
    <>
      {snippets.map((snippet) => (
        <NavLink
          key={snippet.id}
          label={snippet.title}
          leftSection={<IconFile size={16} />}
          onClick={() =>
            router.push(`/projects/${snippet.projectId}/snippets/${snippet.id}`)
          }
        />
      ))}
    </>
  );
};

export default SnippetList;
