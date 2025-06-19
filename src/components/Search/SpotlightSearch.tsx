import { NextRouter, useRouter } from "next/router";
import React, { useState, useMemo, useCallback, JSX } from "react";
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
  Text,
  TextInput,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { spotlight, Spotlight } from "@mantine/spotlight";
import { truncateByWords } from "../../utils/truncateByWords";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useSearch } from "../../hooks/useSearch";
import Loading from "../Loader/Loader";
import FileIcon from "../FileIcon";
import { Project, Snippet, Task } from "@prisma/client";
import classes from "./SpotlightSearch.module.css";
import { useRecentItems } from "../../hooks/useRecentItems";
import { CacheDataSource, TypedItems } from "../../types";
import { useSession } from "next-auth/react";
import { RingLoader } from "../Loader/RingLoader";
import CollapsibleActionsGroup from "./CollapsibleActionsGroup";
import ShortcutHint from "./ShortcutHint";
import { useGetProjectsQuery } from "../../store/api/projectApi";
import { setProjectsOpen } from "../../store/slices/projectSlice";
import { uniqBy } from "lodash";
import { useProjectCacheUpdater } from "../../hooks/useProjectCacheUpdater";

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
  // Escape special regex characters in the query
  const escapedQuery = lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Create regex that matches whole words only
  const regex = new RegExp(`\\b${escapedQuery}\\b`, "i");

  return items?.filter((item) => regex.test(String(item[field])));
};

const ActionItem = ({ item }: { item: DataItem }) => (
  <Spotlight.Action className={classes.noActive}>
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

const SpotlightSearch = ({
  isSmallScreen = false,
}: {
  isSmallScreen: boolean;
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { pageSize, skip } = useAppSelector((state) => state.project);
  const { data, isLoading: isProjectsLoading } = useGetProjectsQuery({
    skip,
    limit: pageSize,
  });

  const loadedProjects = data?.items;

  const {
    matchedResults,
    loading: isSearchLoading,
    isTyping,
    searchCache,
    ringLoader,
  } = useSearch(query);

  const { data: session } = useSession();
  const userId = session?.user?.id ?? undefined;
  const { recentSearchOrder, addRecentItems, clearRecentItems } =
    useRecentItems(userId);

  const snippets = Object.values(
    useAppSelector((state) => state.snippet.loadedSnippets)
  ).flat();
  const dispatch = useAppDispatch();
  const computedColorScheme = useComputedColorScheme();
  const theme = useMantineTheme();
  const updateQueryData = useProjectCacheUpdater();

  const currentProjectId = router.query.projectId as string | undefined;
  const searchCacheArray = Array.from(searchCache.values()).flat();
  const uniqueCacheResults = uniqBy(searchCacheArray, "id");

  const recentItems = useMemo(() => {
    const itemsMap = new Map<string, TypedItems>();

    recentSearchOrder.forEach((key) => {
      const [type, id] = key.split(":");
      let item;

      if (type === "project") {
        item =
          loadedProjects?.find((p) => p.id === id) ||
          uniqueCacheResults.find((r) => r.type === "project" && r.id === id);
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

  const projectSource = useMemo<Omit<DataSource<Project>, "data">>(
    () => ({
      name: "projects",
      groupLabel: "Projects",
      filterData: (projects, query, { matchedResults, isSearchLoading }) => {
        const localProjects = filterByQuery(projects, query);
        const apiProjects =
          !isSearchLoading && matchedResults?.length > 0
            ? matchedResults.filter(
                (apiResult: TypedItems) =>
                  apiResult.type === "project" &&
                  !localProjects.some(
                    (local: Project) => local.id === apiResult.id
                  )
              )
            : [];
        return [...localProjects, ...apiProjects];
      },
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
          const isProjectLoaded = loadedProjects?.find(
            (loaded) => loaded.id === project.id
          );

          if (!isProjectLoaded) {
            updateQueryData(project.id, project);
          }
          dispatch(setProjectsOpen(true));
          addRecentItems([{ ...project, type: "project" }]);
          router.push(`/projects/${project.id}`);
        },
        groupLabel: "Projects",
      }),
    }),
    [dispatch, loadedProjects, updateQueryData]
  );

  const snippetSource = useMemo<
    Omit<DataSource<Snippet & { project?: Project }>, "data">
  >(
    () => ({
      name: "snippets",
      groupLabel: "Snippets",
      filterData: (snippets, query, { matchedResults, isSearchLoading }) => {
        const localSnippets = filterByQuery(snippets, query);
        const apiSnippets =
          !isSearchLoading && matchedResults?.length > 0
            ? matchedResults.filter(
                (apiResult: TypedItems) =>
                  apiResult.type === "snippet" &&
                  !localSnippets.some(
                    (local: Snippet) => local.id === apiResult.id
                  )
              )
            : [];
        return [...localSnippets, ...apiSnippets];
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
          const isProjectLoaded = loadedProjects?.find(
            (loaded) => loaded.id === snippet.projectId
          );
          const project = snippet.project;
          if (!isProjectLoaded && project) {
            updateQueryData(snippet.projectId, project);
          }
          dispatch(setProjectsOpen(true));
          addRecentItems([{ ...snippet, type: "snippet" }]);
          router.push(`/projects/${snippet.projectId}/snippets/${snippet.id}`);
        },
        groupLabel: "Snippets",
        meta: {
          projectTitle:
            projects?.find((project) => project.id === snippet.projectId)
              ?.title ?? "",
        },
      }),
    }),
    [dispatch, loadedProjects, updateQueryData]
  );

  const taskSource = useMemo<
    Omit<DataSource<Task & { project?: Project }>, "data">
  >(
    () => ({
      name: "tasks",
      groupLabel: "Tasks",
      filterData: (_, __, { matchedResults, isSearchLoading }) => {
        const apiTasks =
          !isSearchLoading && matchedResults?.length > 0
            ? matchedResults.filter(
                (apiResult: TypedItems) => apiResult.type === "task"
              )
            : [];
        return apiTasks;
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
          const isProjectLoaded = loadedProjects?.find(
            (loaded) => loaded.id === task.projectId
          );
          const project = task.project;
          if (!isProjectLoaded && project) {
            updateQueryData(task.projectId, project);
          }
          dispatch(setProjectsOpen(true));
          addRecentItems([{ ...task, type: "task" }]);
          router.push(`/projects/${task.projectId}/tasks`);
        },
        groupLabel: "tasks",
        meta: {
          projectTitle:
            projects?.find((project) => project.id === task.projectId)?.title ??
            "",
        },
      }),
    }),
    [dispatch, loadedProjects, updateQueryData]
  );

  const cacheSource = useMemo<Omit<DataSource<CacheDataSource>, "data">>(
    () => ({
      name: "cacheResults",
      groupLabel: "Recently Searched",
      filterData: (results, query, context) => {
        const { matchedResults, projects, snippets, recentSearchOrder } =
          context;

        const hasOtherResults =
          filterByQuery(projects, query)?.length > 0 ||
          filterByQuery(snippets, query)?.length > 0 ||
          matchedResults?.length > 0;

        if (hasOtherResults) {
          return [];
        }

        results.sort((a, b) => {
          const aKey = `${a.type}:${a.id}`;
          const bKey = `${b.type}:${b.id}`;
          const aIndex = recentSearchOrder?.indexOf(aKey) ?? -1;
          const bIndex = recentSearchOrder?.indexOf(bKey) ?? -1;

          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
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
            onClick: () => {
              const isProjectLoaded = loadedProjects?.find(
                (loaded) => loaded.id === item.id
              );

              if (!isProjectLoaded) {
                updateQueryData(item.id, item);
              }

              dispatch(setProjectsOpen(true));
              router.push(`/projects/${item.id}`);
            },
            groupLabel: "Recently Searched",
          };
        } else if (item.type === "snippet") {
          return {
            id: item.id,
            title: `${item.title}.${item.extension ?? ""}`,
            icon: <FileIcon snippet={item} />,
            onClick: () => {
              const isProjectLoaded = loadedProjects?.find(
                (loaded) => loaded.id === item.projectId
              );
              const project = item["project"];
              if (!isProjectLoaded && project) {
                updateQueryData(item.projectId, project);
              }
              dispatch(setProjectsOpen(true));
              router.push(`/projects/${item.projectId}/snippets/${item.id}`);
            },
            groupLabel: "Recently Searched",
            meta: {
              projectTitle:
                projects?.find((project) => project.id === item.projectId)
                  ?.title ?? "",
            },
          };
        } else if (item.type === "task") {
          return {
            id: item.id,
            title: item.title,
            description: item.description ?? "-",
            icon: <IconSubtask />,
            onClick: () => {
              const isProjectLoaded = loadedProjects?.find(
                (loaded) => loaded.id === item.projectId
              );
              const project = item["project"];
              if (!isProjectLoaded && project) {
                updateQueryData(item.projectId, project);
              }
              dispatch(setProjectsOpen(true));
              router.push(`/projects/${item.projectId}/tasks`);
            },
            groupLabel: "Recently Searched",
            meta: {
              projectTitle:
                projects?.find((project) => project.id === item.projectId)
                  ?.title ?? "",
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
    }),
    [updateQueryData, dispatch, loadedProjects]
  );

  const dataSources = useMemo<DataSource[]>(
    () => [
      {
        ...projectSource,
        data: loadedProjects ?? [],
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
    [
      loadedProjects,
      snippets,
      recentItems,
      projectSource,
      snippetSource,
      taskSource,
      cacheSource,
    ]
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
  const loading = isProjectsLoading || isSearchLoading;

  const strokeColor =
    computedColorScheme === "dark"
      ? theme.colors.dark[0]
      : theme.colors.dark[3];

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
            rightSection={<ShortcutHint />}
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
            variant="light"
            onClick={() => spotlight.open()}
            radius="xl"
            size="lg"
            className={classes.icon}
            style={{ transition: "all 0.2s ease" }}
          >
            <IconSearch size={20} />
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

            {ringLoader && (
              <Box className={classes.clearAll}>
                <RingLoader style={{ stroke: strokeColor }} />
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

              if (!items.length) return null;
              return (
                <CollapsibleActionsGroup
                  key={source.name}
                  label={source.groupLabel}
                  groupLabel={`${items.length} ${
                    items.length === 1 ? "Result" : "Results"
                  }`}
                >
                  {items.map((item) => (
                    <ActionItem key={item.id} item={item} />
                  ))}
                </CollapsibleActionsGroup>
              );
            })}
          </Box>

          {query.length > 0 && loading && <Loading loaderHeight="5vh" />}

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
