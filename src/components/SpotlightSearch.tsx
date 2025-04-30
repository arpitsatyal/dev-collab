import { spotlight, Spotlight } from "@mantine/spotlight";
import { IconFile, IconFolder, IconSearch } from "@tabler/icons-react";
import { useGetProjectsQuery } from "../store/api/projectApi";
import Loading from "./Loader";
import { truncateByWords } from "../utils/truncateByWords";
import { useRouter } from "next/router";
import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { useSearch } from "../hooks/useSearch";
import React, { useMemo, useState } from "react";
import { Snippet } from "@prisma/client";
import { getFileName } from "../utils/getFileName";

interface IData {
  projectId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: "project" | "snippet";
  snippetId?: string;
}

const SpotlightSearch = () => {
  const router = useRouter();
  const { data: projects = [], isLoading } = useGetProjectsQuery();
  const [query, setQuery] = useState("");

  const { matchedResults, loading } = useSearch(query);

  const projectData: IData[] = useMemo(
    () =>
      projects.map((project) => ({
        projectId: project.id,
        title: project.title,
        description: project.description ?? "-",
        icon: <IconFolder size={24} stroke={1.5} />,
        type: "project",
      })),
    [projects]
  );

  const snippetData: IData[] = useMemo(() => {
    if (!matchedResults?.length) return [];
    const fileIcon = <IconFile size={24} stroke={1.5} />;

    return matchedResults.map((result) => {
      const snippet: Snippet = result._source;
      return {
        projectId: snippet.projectId,
        snippetId: result._id,
        title: getFileName(snippet) ?? "-",
        description: snippet.language,
        icon: fileIcon,
        type: "snippet",
      };
    });
  }, [matchedResults]);

  const handleQueryChange = (query: string) => {
    setQuery(query);
  };

  const computedData =
    query.trim().length > 0 && snippetData.length > 0
      ? snippetData
      : projectData;

  console.log(computedData);

  const items = computedData.map((item) => {
    const route =
      item.type === "project"
        ? `/projects/${item.projectId}`
        : `/projects/${item.projectId}/snippets/${item.snippetId}`;
    return (
      <Spotlight.Action>
        <Group wrap="nowrap" w="100%">
          {item.icon}

          <Box style={{ flex: 1 }} p={3} onClick={() => router.push(route)}>
            <Text>{item.title}</Text>

            {item.description && (
              <Text opacity={0.6} size="xs">
                {truncateByWords(item.description, 30)}
              </Text>
            )}
          </Box>
        </Group>
      </Spotlight.Action>
    );
  });

  return (
    <>
      <ActionIcon
        variant="subtle"
        onClick={spotlight.open}
        radius="xl"
        size="lg"
        style={{
          transition: "background-color 150ms ease",
          "&:hover": {
            backgroundColor: "#f0f0f0",
          },
        }}
      >
        <IconSearch />
      </ActionIcon>

      <Spotlight.Root
        query={query}
        onQueryChange={handleQueryChange}
        scrollable
        shortcut={["mod + K", "mod + P", "/"]}
      >
        <Spotlight.Search
          placeholder="Search..."
          leftSection={<IconSearch stroke={1.5} />}
        />

        <Spotlight.ActionsList>
          {isLoading || loading ? (
            <Loading loaderHeight="10vh" />
          ) : items.length > 0 ? (
            items
          ) : (
            <Spotlight.Empty>Nothing found...</Spotlight.Empty>
          )}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  );
};

export default SpotlightSearch;
