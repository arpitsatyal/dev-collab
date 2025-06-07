import { NextRouter, useRouter } from "next/router";
import { useState, useMemo, useCallback, JSX, useEffect } from "react";
import { IconSearch, IconFolder, IconSubtask } from "@tabler/icons-react";
import { ActionIcon, Box, Group, Paper, Text, TextInput } from "@mantine/core";
import { spotlight, Spotlight } from "@mantine/spotlight";
import { truncateByWords } from "../../utils/truncateByWords";
import { useAppSelector } from "../../store/hooks";
import { useSearch } from "../../hooks/useSearch";
import Loading from "../Loader";
import FileIcon from "../FileIcon";
import { Project, Snippet, Task } from "@prisma/client";
import { RootState } from "../../store/store";
import classes from "./SpotlightSearch.module.css";
import { WithType } from "../../types/withType";
import { useRecentItems } from "../../hooks/useRecentItems";

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

type TypedProject = WithType<Project, "project">;
type TypedSnippet = WithType<Snippet, "snippet">;
type TypedTask = WithType<Task, "task">;

type MeiliSearchResponse = TypedSnippet | TypedTask;

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
  filterData: (projects, query) => filterByQuery(projects, query),
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
    { router, projects }: { router: NextRouter; projects: Project[] }
  ) => ({
    id: snippet.id,
    title: `${snippet.title}.${snippet.extension ?? ""}`,
    icon: <FileIcon snippet={snippet} />,
    onClick: () =>
      router.push(`/projects/${snippet.projectId}/snippets/${snippet.id}`),
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
    { router, projects }: { router: NextRouter; projects: Project[] }
  ) => ({
    id: task.id,
    title: task.title,
    description: task.description ?? "-",
    icon: <IconSubtask />,
    onClick: () => router.push(`/projects/${task.projectId}/tasks`),
    groupLabel: "tasks",
    meta: {
      projectTitle:
        projects.find((project) => project.id === task.projectId)?.title ?? "",
    },
  }),
};

const cacheSource: Omit<
  DataSource<TypedProject | TypedSnippet | TypedTask>,
  "data"
> = {
  name: "cacheResults",
  groupLabel: "Recently Searched",
  filterData: (results, query, context) => {
    const {
      matchedResults,
      projects,
      snippets,
      recentProjects,
      recentSearchOrder,
    } = context;
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

    // Combine recent projects with cached snippets and tasks
    const combinedResults = [
      ...(recentProjects ?? []).map((project: Project) => ({
        ...project,
        type: "project" as const,
      })),
      ...results,
    ];

    // Sort by recency based on recentSearchOrder
    combinedResults.sort((a, b) => {
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

    return filterByQuery(combinedResults, query, true);
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

  const { addRecentItems, recentProjects, recentSearchOrder } =
    useRecentItems();
  const currentProjectId = router.query.projectId as string | undefined;

  const snippets = Object.values(
    useAppSelector((state) => state.snippet.loadedSnippets)
  ).flat();

  const searchCacheArray = Array.from(searchCache.values()).flat();

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
        data: searchCacheArray,
      },
    ],
    [loadedProjects, snippets, searchCacheArray]
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

  // Compute filtered results
  const filteredProjects = useMemo(
    () => projectSource.filterData(loadedProjects, query, baseContext),
    [loadedProjects, query, baseContext]
  );

  const filteredSnippets = useMemo(
    () => snippetSource.filterData(snippets, query, baseContext),
    [snippets, query, baseContext]
  );

  const filteredTasks = useMemo(
    () => taskSource.filterData([], query, baseContext),
    [query, baseContext]
  );

  useEffect(() => {
    const itemsToTrack = [
      ...filteredProjects.map((p) => ({ ...p, type: "project" })),
      ...filteredSnippets.map((s) => ({ ...s, type: "snippet" })),
      ...filteredTasks.map((t) => ({ ...t, type: "task" })),
    ];
    if (itemsToTrack.length > 0) {
      const timeout = setTimeout(() => {
        addRecentItems(itemsToTrack);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [filteredProjects, filteredSnippets, filteredTasks, addRecentItems]);

  const context = useMemo(
    () => ({
      ...baseContext,
      recentProjects,
      recentSearchOrder,
    }),
    [baseContext, recentProjects, recentSearchOrder]
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

          {query.length > 0 && (isProjectsLoading || isSearchLoading) && (
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

          {query.length === 0 && allItems.length === 0 && (
            <Spotlight.Empty>
              Search for any Projects, Snippets or Tasks!
            </Spotlight.Empty>
          )}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  );
};

export default SpotlightSearch;
