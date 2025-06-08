import { NextRouter, useRouter } from "next/router";
import { useState, useMemo, useCallback, JSX } from "react";
import {
  IconSearch,
  IconFolder,
  IconSubtask,
  IconClearAll,
} from "@tabler/icons-react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Text,
  TextInput,
} from "@mantine/core";
import { spotlight, Spotlight } from "@mantine/spotlight";
import { truncateByWords } from "../../utils/truncateByWords";
import { useAppSelector } from "../../store/hooks";
import { useSearch } from "../../hooks/useSearch";
import Loading from "../Loader";
import FileIcon from "../FileIcon";
import { Project, Snippet, Task } from "@prisma/client";
import { RootState } from "../../store/store";
import classes from "./SpotlightSearch.module.css";
import { useRecentItems } from "../../hooks/useRecentItems";
import { MeiliSearchResponse, TypedItems } from "../../types";
import { useSession } from "next-auth/react";

interface DataItem {
  id: string;
  title: string;
  icon: JSX.Element;
  onClick: () => void;
  groupLabel: string;
  description?: string;
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
  return items?.filter((item) =>
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
  filterData: (projects, query) => filterByQuery(projects, query, false),
  toDataItem: (
    project,
    {
      router,
      addRecentItems,
    }: { router: NextRouter; addRecentItems: (items: TypedItems[]) => void }
  ) => ({
    id: project.id,
    title: project.title,
    description: project.description ?? "-",
    icon: <IconFolder size={24} stroke={1.5} />,
    onClick: () => {
      addRecentItems([{ ...project, type: "project" }]);
      router.push(`/projects/${project.id}`);
    },
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
        ? matchedResults.filter(
            (apiResult: MeiliSearchResponse) =>
              apiResult.type === "snippet" &&
              !localSnippets.some((local: Snippet) => local.id === apiResult.id)
          )
        : [];
    const allSnippets = [...localSnippets, ...apiSnippets];
    return sortByCurrentProject(allSnippets, currentProjectId);
  },
  toDataItem: (
    snippet,
    {
      router,
      projects,
      addRecentItems,
    }: {
      router: NextRouter;
      projects: Project[];
      addRecentItems: (items: TypedItems[]) => void;
    }
  ) => ({
    id: snippet.id,
    title: `${snippet.title}.${snippet.extension ?? ""}`,
    icon: <FileIcon snippet={snippet} />,
    onClick: () => {
      addRecentItems([{ ...snippet, type: "snippet" }]);
      router.push(`/projects/${snippet.projectId}/snippets/${snippet.id}`);
    },
    groupLabel: "Snippets",
    meta: {
      projectTitle:
        projects.find((project) => project.id === snippet.projectId)?.title ??
        "",
    },
  }),
};

const taskSource: Omit<DataSource<Task>, "data"> = {
  name: "tasks",
  groupLabel: "Tasks",
  filterData: (
    _,
    __,
    { matchedResults, currentProjectId, isSearchLoading }
  ) => {
    const apiTasks =
      !isSearchLoading && matchedResults?.length > 0
        ? matchedResults.filter(
            (apiResult: MeiliSearchResponse) => apiResult.type === "task"
          )
        : [];
    return sortByCurrentProject(apiTasks, currentProjectId);
  },
  toDataItem: (
    task,
    {
      router,
      projects,
      addRecentItems,
    }: {
      router: NextRouter;
      projects: Project[];
      addRecentItems: (items: TypedItems[]) => void;
    }
  ) => ({
    id: task.id,
    title: task.title,
    description: task.description ?? "-",
    icon: <IconSubtask />,
    onClick: () => {
      addRecentItems([{ ...task, type: "task" }]);
      router.push(`/projects/${task.projectId}/tasks`);
    },
    groupLabel: "tasks",
    meta: {
      projectTitle:
        projects.find((project) => project.id === task.projectId)?.title ?? "",
    },
  }),
};

const cacheSource: Omit<DataSource<TypedItems>, "data"> = {
  name: "cacheResults",
  groupLabel: "Recently Searched",
  filterData: (results, query, context) => {
    const { matchedResults, projects, snippets, recentSearchOrder } = context;
    // Only show cache if no results from other sources
    const hasOtherResults =
      filterByQuery(projects, query)?.length > 0 ||
      filterByQuery(snippets, query)?.length > 0 ||
      (matchedResults?.length > 0 &&
        matchedResults.some(
          (result: MeiliSearchResponse) =>
            result.type === "snippet" || result.type === "task"
        ));

    if (hasOtherResults) {
      return [];
    }

    // Sort by recency based on recentSearchOrder
    results.sort((a, b) => {
      const aKey = `${a.type}:${a.id}`;
      const bKey = `${b.type}:${b.id}`;
      const aIndex = recentSearchOrder?.indexOf(aKey) ?? -1;
      const bIndex = recentSearchOrder?.indexOf(bKey) ?? -1;
      // Items not in recentSearchOrder go to the end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex; // Earlier index (more recent) comes first
    });

    return filterByQuery(results, query, true);
  },
  toDataItem: (
    item,
    { router, projects }: { router: NextRouter; projects: Project[] }
  ) => {
    if (item.type === "project") {
      return {
        id: item.id,
        title: item.title,
        description: item.description ?? "-",
        icon: <IconFolder size={24} stroke={1.5} />,
        onClick: () => router.push(`/projects/${item.id}`),
        groupLabel: "Recently Searched",
      };
    } else if (item.type === "snippet") {
      return {
        id: item.id,
        title: `${item.title}.${item.extension ?? ""}`,
        icon: <FileIcon snippet={item} />,
        onClick: () =>
          router.push(`/projects/${item.projectId}/snippets/${item.id}`),
        groupLabel: "Recently Searched",
        meta: {
          projectTitle:
            projects.find((project) => project.id === item.projectId)?.title ??
            "",
        },
      };
    } else if (item.type === "task") {
      return {
        id: item.id,
        title: item.title,
        description: item.description ?? "-",
        icon: <IconSubtask />,
        onClick: () => router.push(`/projects/${item.projectId}/tasks`),
        groupLabel: "Recently Searched",
        meta: {
          projectTitle:
            projects.find((project) => project.id === item.projectId)?.title ??
            "",
        },
      };
    }

    return {
      id: "",
      title: "",
      description: "",
      icon: <IconFolder />,
      onClick: () => {},
      groupLabel: "",
      meta: {},
    };
  },
};

const SpotlightSearch = ({
  isSmallScreen = false,
}: {
  isSmallScreen: boolean;
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { loadedProjects, isLoading: isProjectsLoading } = useAppSelector(
    (state: RootState) => state.project
  );

  const {
    matchedResults,
    loading: isSearchLoading,
    isTyping,
    searchCache,
  } = useSearch(query);

  const { data: session } = useSession();
  const userId = session?.user?.id ?? undefined;
  const { recentSearchOrder, addRecentItems, clearRecentItems } =
    useRecentItems(userId);

  const snippets = Object.values(
    useAppSelector((state) => state.snippet.loadedSnippets)
  ).flat();

  const currentProjectId = router.query.projectId as string | undefined;
  const searchCacheArray = Array.from(searchCache.values()).flat();
  const uniqueCacheResults = Array.from(
    new Map(searchCacheArray.map((item) => [item.id, item])).values()
  );

  const recentItems = useMemo(() => {
    const itemsMap = new Map<string, TypedItems>();

    recentSearchOrder.forEach((key) => {
      const [type, id] = key.split(":");
      let item;

      if (type === "project") {
        item = loadedProjects.find((p) => p.id === id);
      } else if (type === "snippet") {
        item =
          snippets.find((s) => s.id === id) ||
          uniqueCacheResults.find((r) => r.type === "snippet" && r.id === id);
      } else if (type === "task") {
        item = uniqueCacheResults.find((r) => r.type === "task" && r.id === id);
      }

      if (item) {
        itemsMap.set(`${type}:${id}`, { ...item, type } as TypedItems);
      }
    });

    // Now return in the same order
    return recentSearchOrder.map((key) => itemsMap.get(key)).filter(Boolean); // remove nulls
  }, [recentSearchOrder, loadedProjects, snippets, uniqueCacheResults]);

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
      {
        ...taskSource,
        data: [],
      },
      {
        ...cacheSource,
        data: recentItems,
      },
    ],
    [loadedProjects, snippets, recentItems]
  );

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const baseContext = useMemo(
    () => ({
      router,
      projects: loadedProjects,
      matchedResults,
      currentProjectId,
      isSearchLoading,
    }),
    [router, loadedProjects, matchedResults, currentProjectId, isSearchLoading]
  );

  const context = useMemo(
    () => ({
      ...baseContext,
      recentSearchOrder,
      addRecentItems,
    }),
    [baseContext, recentSearchOrder, addRecentItems]
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

  const showClearAll = recentItems.length > 0 && query.length === 0;
  const showEmpty = allItems.length === 0 && !isSearchLoading;
  const showResultCount = query.length > 0 && allItems.length > 0;
  const loading = isProjectsLoading || isSearchLoading;

  return (
    <>
      <Box>
        {!isSmallScreen ? (
          <TextInput
            placeholder="Search"
            leftSection={
              <IconSearch
                size={18}
                style={{
                  cursor: "pointer",
                }}
                onClick={() => spotlight.open()}
              />
            }
            rightSection={
              <Box
                style={{
                  paddingRight: "40px",
                  cursor: "pointer",
                }}
                onClick={() => spotlight.open()}
              >
                <Paper
                  shadow="xs"
                  style={{
                    width: "60px",
                    padding: "5px",
                  }}
                  className={classes.shortcut}
                >
                  <Text size="xs" fw={700} lh={1}>
                    Ctrl + K
                  </Text>
                </Paper>
              </Box>
            }
            radius="md"
            styles={{
              input: {
                cursor: "pointer",
                "&:focus": {
                  outline: "none",
                },
              },
            }}
            onClick={() => spotlight.open()}
            onFocus={(e) => e.target.blur()}
            readOnly
          />
        ) : (
          <ActionIcon
            variant="subtle"
            onClick={() => spotlight.open()}
            radius="md"
            size="lg"
            className={classes.icon}
          >
            <IconSearch size={24} />
          </ActionIcon>
        )}
      </Box>
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
          <Box
            style={(theme) => ({
              position: "relative",
              paddingTop: theme.spacing.lg,
            })}
          >
            {showClearAll && (
              <Box className={classes.clearAll}>
                <Button
                  size="xs"
                  variant="light"
                  radius="xl"
                  onClick={clearRecentItems}
                  leftSection={<IconClearAll size={16} />}
                >
                  Clear All
                </Button>
              </Box>
            )}

            {dataSources.map((source) => {
              const filteredData = source.filterData(
                source.data,
                query,
                context
              );
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
          </Box>

          {query.length > 0 && loading && <Loading loaderHeight="5vh" />}

          {showResultCount && (
            <Text style={{ textAlign: "center", paddingTop: 1 }}>
              {allItems.length} {allItems.length === 1 ? "Result" : "Results"}{" "}
              Found
            </Text>
          )}

          {showEmpty && (
            <Spotlight.Empty>
              {query.length === 0
                ? "Search for any Projects, Snippets or Tasks!"
                : isTyping
                ? "Searching..."
                : "Nothing found..."}
            </Spotlight.Empty>
          )}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  );
};

export default SpotlightSearch;
