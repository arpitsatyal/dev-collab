import { NextRouter, useRouter } from "next/router";
import { useState, useMemo, useCallback, JSX } from "react";
import { IconSearch, IconFolder } from "@tabler/icons-react";
import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { spotlight, Spotlight } from "@mantine/spotlight";
import { truncateByWords } from "../utils/truncateByWords";
import { useAppSelector } from "../store/hooks";
import { useSearch } from "../hooks/useSearch";
import Loading from "./Loader";
import FileIcon from "./FileIcon";
import { Project, Snippet } from "@prisma/client";
import { RootState } from "../store/store";

interface DataItem {
  id: string;
  title: string;
  description?: string;
  icon: JSX.Element;
  onClick: () => void;
  groupLabel: string;
  meta?: Record<string, any>;
}

interface DataSource<T = any> {
  name: string;
  groupLabel: string;
  data: T[];
  filterData: (data: T[], query: string, context: any) => T[];
  toDataItem: (item: T, context: any) => DataItem;
}

const filterByQuery = <T extends { title: string }>(
  items: T[],
  query: string,
  showAllOnEmpty: boolean = false,
  field: keyof T = "title"
): T[] => {
  if (!query && showAllOnEmpty) return items;
  if (!query) return [];
  const lowerQuery = query.toLowerCase().trim();
  return items.filter((item) =>
    String(item[field]).toLowerCase().includes(lowerQuery)
  );
};

const sortByCurrentProject = <T extends { title: string; projectId?: string }>(
  items: T[],
  currentProjectId?: string
): T[] => {
  if (!currentProjectId)
    return items.sort((a, b) => a.title.localeCompare(b.title));
  return items.sort((a, b) => {
    if (a.projectId === currentProjectId && b.projectId !== currentProjectId)
      return -1;
    if (b.projectId === currentProjectId && a.projectId !== currentProjectId)
      return 1;
    return a.title.localeCompare(b.title);
  });
};

const ActionItem = ({ item }: { item: DataItem }) => (
  <Spotlight.Action highlightQuery>
    <Group wrap="nowrap" w="100%">
      {item.icon}
      <Box style={{ flex: 1 }} p={3} onClick={item.onClick}>
        <Text>{item.title}</Text>
        {item.meta?.projectTitle ? (
          <Group gap="xs">
            <IconFolder size={16} />
            <Text size="xs" opacity={0.6}>
              {item.meta.projectTitle}
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

const projectSource: Omit<DataSource<Project>, "data"> = {
  name: "projects",
  groupLabel: "Projects",
  filterData: (projects, query) => filterByQuery(projects, query, true),
  toDataItem: (project, { router }: { router: NextRouter }) => ({
    id: project.id,
    title: project.title,
    description: project.description ?? "-",
    icon: <IconFolder size={24} stroke={1.5} />,
    onClick: () => router.push(`/projects/${project.id}`),
    groupLabel: "Projects",
  }),
};

const snippetSource: Omit<DataSource<Snippet>, "data"> = {
  name: "snippets",
  groupLabel: "Snippets",
  filterData: (
    snippets,
    query,
    { matchedResults, currentProjectId, isSearchLoading }
  ) => {
    const localSnippets = filterByQuery(snippets, query);
    // Only include API snippets if not loading and results exist
    const apiSnippets =
      !isSearchLoading && matchedResults?.length > 0
        ? matchedResults
            .map((result: any) => ({
              id: result._id,
              ...result._source,
            }))
            .filter(
              (apiSnippet: Snippet) =>
                !localSnippets.some(
                  (local: Snippet) => local.id === apiSnippet.id
                )
            )
        : [];
    const allSnippets = [...localSnippets, ...apiSnippets];
    return sortByCurrentProject(allSnippets, currentProjectId);
  },
  toDataItem: (
    snippet,
    { router, projects }: { router: NextRouter; projects: Project[] }
  ) => ({
    id: snippet.id,
    title: `${snippet.title}.${snippet.extension ?? ""}`,
    description: snippet.language,
    icon: <FileIcon snippet={snippet} />,
    onClick: () =>
      router.push(`/projects/${snippet.projectId}/snippets/${snippet.id}`),
    groupLabel: "Snippets",
    meta: {
      projectTitle: projects.find((p) => p.id === snippet.projectId)?.title,
    },
  }),
};

const SpotlightSearch = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { loadedProjects, isLoading: isProjectsLoading } = useAppSelector(
    (state: RootState) => state.project
  );
  const {
    matchedResults,
    loading: isSearchLoading,
    isTyping,
  } = useSearch(query);
  const currentProjectId = router.query.projectId as string | undefined;

  const snippets = Object.values(
    useAppSelector((state) => state.snippet.loadedSnippets)
  ).flat();

  const dataSources = useMemo<DataSource[]>(
    () => [
      {
        ...projectSource,
        data: loadedProjects,
      },
      {
        ...snippetSource,
        data: snippets,
      },
    ],
    [loadedProjects, snippets]
  );

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const context = useMemo(
    () => ({
      router,
      loadedProjects,
      matchedResults,
      currentProjectId,
      isSearchLoading,
    }),
    [router, loadedProjects, matchedResults, currentProjectId, isSearchLoading]
  );

  const allItems = useMemo(() => {
    const items: DataItem[] = [];
    dataSources.forEach((source) => {
      const filteredData = source.filterData(source.data, query, context);
      const sourceItems = filteredData.map((item) =>
        source.toDataItem(item, context)
      );
      items.push(...sourceItems);
    });
    return items;
  }, [query, context, dataSources]);

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
        fullScreen
        shortcut={["mod + K", "mod + P", "/"]}
      >
        <Spotlight.Search
          placeholder="Search..."
          leftSection={<IconSearch stroke={1.5} />}
        />
        <Spotlight.ActionsList>
          {dataSources.map((source) => {
            const filteredData = source.filterData(source.data, query, context);
            const items = filteredData.map((item) =>
              source.toDataItem(item, context)
            );
            return (
              <Spotlight.ActionsGroup
                key={source.name}
                label={source.groupLabel}
              >
                {items.map((item) => (
                  <ActionItem key={item.id} item={item} />
                ))}
              </Spotlight.ActionsGroup>
            );
          })}

          {(isProjectsLoading || isSearchLoading) && (
            <Loading loaderHeight="5vh" />
          )}

          {query.length > 0 && allItems.length > 0 && (
            <Text style={{ textAlign: "center", paddingTop: 1 }}>
              {allItems.length} {allItems.length === 1 ? "Result" : "Results"}{" "}
              Found
            </Text>
          )}

          {query.length > 0 && allItems.length === 0 && !isSearchLoading && (
            <Spotlight.Empty>
              {isTyping ? "Searching..." : "Nothing found..."}
            </Spotlight.Empty>
          )}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  );
};

export default SpotlightSearch;
