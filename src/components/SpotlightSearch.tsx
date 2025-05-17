import { useRouter } from "next/router";
import { useState, useMemo, useCallback, JSX } from "react";

import { IconSearch, IconFolder } from "@tabler/icons-react";
import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { spotlight, Spotlight } from "@mantine/spotlight";
import { truncateByWords } from "../utils/truncateByWords";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useGetProjectsQuery } from "../store/api/projectApi";
import { useSearch } from "../hooks/useSearch";
import Loading from "./Loader";
import FileIcon from "./FileIcon";
import { Snippet } from "@prisma/client";

interface DataItem {
  projectId: string;
  snippetId?: string;
  title: string;
  description: string;
  icon: JSX.Element;
}

// Utility function to filter snippets
const filterSnippetsByQuery = (
  snippets: Snippet[],
  query: string
): Snippet[] => {
  if (!query) return [];
  const lowerQuery = query.toLowerCase().trim();
  return snippets.filter((snippet) =>
    snippet.title.toLowerCase().includes(lowerQuery)
  );
};

// Component to render a single action item
const ActionItem = ({
  item,
  onClick,
  projectTitle,
}: {
  item: DataItem;
  onClick: () => void;
  projectTitle?: string;
}) => (
  <Spotlight.Action>
    <Group wrap="nowrap" w="100%">
      {item.icon}
      <Box style={{ flex: 1 }} p={3} onClick={onClick}>
        <Text>{item.title}</Text>
        {item.snippetId ? (
          <Group gap="xs">
            <IconFolder size={16} />
            <Text size="xs" opacity={0.6}>
              {projectTitle ?? ""}
            </Text>
          </Group>
        ) : (
          item.description && (
            <Text opacity={0.6} size="xs">
              {truncateByWords(item.description, 30)}
            </Text>
          )
        )}
      </Box>
    </Group>
  </Spotlight.Action>
);

const SpotlightSearch = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: projects = [], isLoading: isProjectsLoading } =
    useGetProjectsQuery();
  const [query, setQuery] = useState("");
  const [matchedSnippets, setMatchedSnippets] = useState<Snippet[]>([]);
  const loadedSnippets = useAppSelector(
    (state) => state.snippet.loadedSnippets
  );

  const currentProjectId = router.query.projectId as string | undefined;

  const { matchedResults, loading: isSearchLoading } = useSearch(query);

  // Handle query changes
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      if (!newQuery) {
        setMatchedSnippets([]);
        return;
      }

      // Search all projects in loadedSnippets
      const allMatches = Object.keys(loadedSnippets).reduce(
        (acc, projectId) => {
          const snippets = filterSnippetsByQuery(
            loadedSnippets[projectId],
            newQuery
          );
          return [
            ...acc,
            ...snippets.map((snippet) => ({ ...snippet, projectId })),
          ];
        },
        [] as Snippet[]
      );

      // Sort to prioritize current project
      const sortedMatches = allMatches.sort((a, b) => {
        if (currentProjectId) {
          if (
            a.projectId === currentProjectId &&
            b.projectId !== currentProjectId
          )
            return -1;
          if (
            b.projectId === currentProjectId &&
            a.projectId !== currentProjectId
          )
            return 1;
        }
        return a.title.localeCompare(b.title);
      });

      setMatchedSnippets(sortedMatches);
    },
    [loadedSnippets, currentProjectId]
  );

  // Process project data
  const projectItems = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();
    return projects
      .filter((project) => project.title.toLowerCase().includes(lowerQuery))
      .map((project) => ({
        projectId: project.id,
        title: project.title,
        description: project.description ?? "-",
        icon: <IconFolder size={24} stroke={1.5} />,
        onClick: () => router.push(`/projects/${project.id}`),
      }));
  }, [projects, query, router]);

  // Process snippet data
  const snippetItems = useMemo(() => {
    // Combine local and API results, avoiding duplicates
    const localSnippets = matchedSnippets;
    const apiSnippets = (
      matchedResults?.map((result) => ({
        id: result._id,
        ...result._source,
      })) || []
    ).filter(
      (apiSnippet) => !localSnippets.some((local) => local.id === apiSnippet.id)
    );

    const allSnippets = [...localSnippets, ...apiSnippets];

    if (!allSnippets.length) return [];

    // Sort to prioritize current project
    allSnippets.sort((a, b) => {
      if (currentProjectId) {
        if (
          a.projectId === currentProjectId &&
          b.projectId !== currentProjectId
        )
          return -1;
        if (
          b.projectId === currentProjectId &&
          a.projectId !== currentProjectId
        )
          return 1;
      }
      return a.title.localeCompare(b.title);
    });

    return allSnippets.map((snippet) => {
      return {
        projectId: snippet.projectId,
        snippetId: snippet.id,
        title: `${snippet.title}.${snippet.extension ?? ""}`,
        description: snippet.language,
        icon: <FileIcon snippet={snippet} />,
        onClick: () =>
          router.push(`/projects/${snippet.projectId}/snippets/${snippet.id}`),
        projectTitle: projects.find((p) => p.id === snippet.projectId)?.title,
      };
    });
  }, [
    matchedSnippets,
    matchedResults,
    dispatch,
    router,
    projects,
    currentProjectId,
  ]);

  // Combine items for rendering
  const allItems = [...projectItems, ...snippetItems];

  return (
    <>
      <ActionIcon
        variant="subtle"
        onClick={spotlight.open}
        radius="xl"
        size="lg"
        style={{
          transition: "background-color 150ms ease",
          "&:hover": { backgroundColor: "#f0f0f0" },
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
          {isProjectsLoading ? (
            <Loading loaderHeight="10vh" />
          ) : (
            <>
              <Spotlight.ActionsGroup label="Projects">
                {projectItems.map((item) => (
                  <ActionItem
                    key={item.projectId}
                    item={item}
                    onClick={item.onClick}
                  />
                ))}
              </Spotlight.ActionsGroup>
              {(snippetItems.length > 0 &&
                query.length > 0 &&
                !isSearchLoading) ||
              (isSearchLoading && matchedSnippets.length > 0) ? (
                <Spotlight.ActionsGroup label="Snippets">
                  {snippetItems.map((item) => (
                    <ActionItem
                      key={item.snippetId}
                      item={item}
                      onClick={item.onClick}
                      projectTitle={item.projectTitle}
                    />
                  ))}
                </Spotlight.ActionsGroup>
              ) : null}

              {isSearchLoading && <Loading loaderHeight="10vh" />}

              {query.length > 0 && allItems.length > 0 && (
                <Text style={{ textAlign: "center", paddingTop: 1 }}>
                  {allItems.length}{" "}
                  {allItems.length === 1 ? "Result" : "Results"} Found
                </Text>
              )}
              {query.length > 0 &&
                allItems.length === 0 &&
                !isSearchLoading && (
                  <Spotlight.Empty>Nothing found...</Spotlight.Empty>
                )}
            </>
          )}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  );
};

export default SpotlightSearch;
