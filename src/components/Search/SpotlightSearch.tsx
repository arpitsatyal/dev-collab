import { NextRouter, useRouter } from "next/router";
import React, { useState, useMemo, useCallback, JSX } from "react";
import {
  IconSearch,
  IconFolder,
  IconClearAll,
  IconSubtask,
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
import { Snippet, WorkItem } from "../../types";
import classes from "./SpotlightSearch.module.css";
import { useRecentItems } from "../../hooks/useRecentItems";
import { CacheDataSource, WorkspaceWithPin, TypedItems } from "../../types";
import { useSession } from "../providers/AuthProvider";
import { RingLoader } from "../Loader/RingLoader";
import CollapsibleActionsGroup from "./CollapsibleActionsGroup";
import ShortcutHint from "./ShortcutHint";
import { useGetWorkspacesQuery } from "../../store/api/workspaceApi";
import { setWorkspacesOpen } from "../../store/slices/workspaceSlice";
import { uniqBy } from "lodash";
import { useWorkspaceCacheUpdater } from "../../hooks/useWorkspaceCacheUpdater";

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
  const escapedQuery = lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escapedQuery}\\b`, "i");

  return items?.filter((item) => regex.test(String(item[field])));
};

const ActionItem = ({ item }: { item: DataItem }) => (
  <Spotlight.Action className={classes.noActive}>
    <Group wrap="nowrap" w="100%">
      {item.icon}
      <Box style={{ flex: 1 }} p={3} onClick={item.onClick}>
        <Text>{item.title}</Text>
        {item.meta?.workspaceTitle ? (
          <Group gap="xs">
            <IconFolder size={16} />
            <Text size="xs" opacity={0.6}>
              {item.meta.workspaceTitle}
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
  const { pageSize, skip } = useAppSelector((state) => state.workspace);
  const { data, isLoading: isWorkspacesLoading } = useGetWorkspacesQuery({
    skip,
    limit: pageSize,
  });

  const loadedWorkspaces = data?.items;

  const {
    matchedResults,
    loading: isSearchLoading,
    isTyping,
    searchCache,
    ringLoader,
    resultsKey,
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
  const updateQueryData = useWorkspaceCacheUpdater();

  const currentWorkspaceId = router.query.workspaceId as string | undefined;
  const searchCacheArray = Array.from(searchCache.values()).flat();
  const uniqueCacheResults = uniqBy(searchCacheArray, "id");

  const recentItems = useMemo(() => {
    const itemsMap = new Map<string, TypedItems>();

    recentSearchOrder.forEach((key) => {
      const [type, id] = key.split(":");
      let item;

      if (type === "workspace") {
        item =
          loadedWorkspaces?.find((p) => p.id === id) ||
          uniqueCacheResults.find((r) => r.type === "workspace" && r.id === id);
      } else if (type === "snippet") {
        item =
          snippets.find((s) => s.id === id) ||
          uniqueCacheResults.find((r) => r.type === "snippet" && r.id === id);
      } else if (type === "workItem") {
        item = uniqueCacheResults.find((r) => r.type === "workItem" && r.id === id);
      }

      if (item) {
        itemsMap.set(`${type}:${id}`, { ...item, type } as TypedItems);
      }
    });

    // Now return in the same order
    return recentSearchOrder.map((key) => itemsMap.get(key)).filter(Boolean); // remove nulls
  }, [recentSearchOrder, loadedWorkspaces, snippets, uniqueCacheResults]);

  const workspaceSource = useMemo<Omit<DataSource<WorkspaceWithPin>, "data">>(
    () => ({
      name: "workspaces",
      groupLabel: "Workspaces",
      filterData: (workspaces, query, { matchedResults, isSearchLoading }) => {
        const localWorkspaces = filterByQuery(workspaces, query);
        const apiWorkspaces =
          !isSearchLoading && matchedResults?.length > 0
            ? matchedResults.filter(
              (apiResult: TypedItems) =>
                apiResult.type === "workspace" &&
                !localWorkspaces.some(
                  (local: WorkspaceWithPin) => local.id === apiResult.id
                )
            )
            : [];
        return [...localWorkspaces, ...apiWorkspaces];
      },
      toDataItem: (
        workspace,
        {
          router,
          addRecentItems,
        }: { router: NextRouter; addRecentItems: (items: TypedItems[]) => void }
      ) => ({
        id: workspace.id,
        title: workspace.title,
        description: workspace.description ?? "-",
        icon: <IconFolder size={24} stroke={1.5} />,
        onClick: () => {
          const isWorkspaceLoaded = loadedWorkspaces?.find(
            (loaded) => loaded.id === workspace.id
          );

          if (!isWorkspaceLoaded) {
            updateQueryData(workspace.id, workspace);
          }
          dispatch(setWorkspacesOpen(true));
          addRecentItems([{ ...workspace, type: "workspace" }]);
          router.push(`/workspaces/${workspace.id}`);
        },
        groupLabel: "Workspaces",
      }),
    }),
    [dispatch, loadedWorkspaces, updateQueryData]
  );

  const snippetSource = useMemo<
    Omit<DataSource<Snippet & { workspace?: WorkspaceWithPin }>, "data">
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
          workspaces,
          addRecentItems,
        }: {
          router: NextRouter;
          workspaces: WorkspaceWithPin[];
          addRecentItems: (items: TypedItems[]) => void;
        }
      ) => ({
        id: snippet.id,
        title: `${snippet.title}.${snippet.extension ?? ""}`,
        icon: <FileIcon snippet={snippet} />,
        onClick: () => {
          const isWorkspaceLoaded = loadedWorkspaces?.find(
            (loaded) => loaded.id === snippet.workspaceId
          );
          const workspace = snippet.workspace;
          if (!isWorkspaceLoaded && workspace) {
            updateQueryData(snippet.workspaceId, workspace);
          }
          dispatch(setWorkspacesOpen(true));
          addRecentItems([{ ...snippet, type: "snippet" }]);
          router.push(`/workspaces/${snippet.workspaceId}/snippets/${snippet.id}`);
        },
        groupLabel: "Snippets",
        meta: {
          workspaceTitle:
            workspaces?.find((workspace) => workspace.id === snippet.workspaceId)
              ?.title ?? "",
        },
      }),
    }),
    [dispatch, loadedWorkspaces, updateQueryData]
  );

  const workItemSource = useMemo<
    Omit<DataSource<WorkItem & { workspace?: WorkspaceWithPin }>, "data">
  >(
    () => ({
      name: "workItems",
      groupLabel: "WorkItems",
      filterData: (_, __, { matchedResults, isSearchLoading }) => {
        const apiWorkItems =
          !isSearchLoading && matchedResults?.length > 0
            ? matchedResults.filter(
              (apiResult: TypedItems) => apiResult.type === "workItem"
            )
            : [];
        return apiWorkItems;
      },
      toDataItem: (
        workItem,
        {
          router,
          workspaces,
          addRecentItems,
        }: {
          router: NextRouter;
          workspaces: WorkspaceWithPin[];
          addRecentItems: (items: TypedItems[]) => void;
        }
      ) => ({
        id: workItem.id,
        title: workItem.title,
        description: workItem.description ?? "-",
        icon: <IconSubtask />,
        onClick: () => {
          const isWorkspaceLoaded = loadedWorkspaces?.find(
            (loaded) => loaded.id === workItem.workspaceId
          );
          const workspace = workItem.workspace;
          if (!isWorkspaceLoaded && workspace) {
            updateQueryData(workItem.workspaceId, workspace);
          }
          dispatch(setWorkspacesOpen(true));
          addRecentItems([{ ...workItem, type: "workItem" }]);
          router.push(`/workspaces/${workItem.workspaceId}/work-items`);
        },
        groupLabel: "workItems",
        meta: {
          workspaceTitle:
            workspaces?.find((workspace) => workspace.id === workItem.workspaceId)?.title ??
            "",
        },
      }),
    }),
    [dispatch, loadedWorkspaces, updateQueryData]
  );

  const cacheSource = useMemo<Omit<DataSource<CacheDataSource>, "data">>(
    () => ({
      name: "cacheResults",
      groupLabel: "Recently Searched",
      filterData: (results, query, context) => {
        const { matchedResults, workspaces, snippets, recentSearchOrder } =
          context;

        const hasOtherResults =
          filterByQuery(workspaces, query)?.length > 0 ||
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
        { router, workspaces }: { router: NextRouter; workspaces: WorkspaceWithPin[] }
      ) => {
        if (item.type === "workspace") {
          return {
            id: item.id,
            title: item.title,
            description: item.description ?? "-",
            icon: <IconFolder size={24} stroke={1.5} />,
            onClick: () => {
              const isWorkspaceLoaded = loadedWorkspaces?.find(
                (loaded) => loaded.id === item.id
              );

              if (!isWorkspaceLoaded) {
                updateQueryData(item.id, item);
              }

              dispatch(setWorkspacesOpen(true));
              router.push(`/workspaces/${item.id}`);
            },
            groupLabel: "Recently Searched",
          };
        } else if (item.type === "snippet") {
          return {
            id: item.id,
            title: `${item.title}.${item.extension ?? ""}`,
            icon: <FileIcon snippet={item} />,
            onClick: () => {
              const isWorkspaceLoaded = loadedWorkspaces?.find(
                (loaded) => loaded.id === item.workspaceId
              );
              const workspace = item["workspace"];
              if (!isWorkspaceLoaded && workspace) {
                updateQueryData(item.workspaceId, workspace);
              }
              dispatch(setWorkspacesOpen(true));
              router.push(`/workspaces/${item.workspaceId}/snippets/${item.id}`);
            },
            groupLabel: "Recently Searched",
            meta: {
              workspaceTitle:
                workspaces?.find((workspace) => workspace.id === item.workspaceId)
                  ?.title ?? "",
            },
          };
        } else if (item.type === "workItem") {
          return {
            id: item.id,
            title: item.title,
            description: item.description ?? "-",
            icon: <IconSubtask />,
            onClick: () => {
              const isWorkspaceLoaded = loadedWorkspaces?.find(
                (loaded) => loaded.id === item.workspaceId
              );
              const workspace = item["workspace"];
              if (!isWorkspaceLoaded && workspace) {
                updateQueryData(item.workspaceId, workspace);
              }
              dispatch(setWorkspacesOpen(true));
              router.push(`/workspaces/${item.workspaceId}/work-items`);
            },
            groupLabel: "Recently Searched",
            meta: {
              workspaceTitle:
                workspaces?.find((workspace) => workspace.id === item.workspaceId)
                  ?.title ?? "",
            },
          };
        }

        return {
          id: "",
          title: "",
          description: "",
          icon: <IconFolder />,
          onClick: () => { },
          groupLabel: "",
          meta: {},
        };
      },
    }),
    [updateQueryData, dispatch, loadedWorkspaces]
  );

  const dataSources = useMemo<DataSource[]>(
    () => [
      {
        ...workspaceSource,
        data: loadedWorkspaces ?? [],
      },
      {
        ...snippetSource,
        data: snippets,
      },
      {
        ...workItemSource,
        data: [],
      },
      {
        ...cacheSource,
        data: recentItems,
      },
    ],
    [
      loadedWorkspaces,
      snippets,
      recentItems,
      workspaceSource,
      snippetSource,
      workItemSource,
      cacheSource,
    ]
  );

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const baseContext = useMemo(
    () => ({
      router,
      workspaces: loadedWorkspaces,
      matchedResults,
      currentWorkspaceId,
      isSearchLoading,
    }),
    [router, loadedWorkspaces, matchedResults, currentWorkspaceId, isSearchLoading]
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
  const loading = isWorkspacesLoading || isSearchLoading;

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
                  groupLabel={`${items.length} ${items.length === 1 ? "Result" : "Results"
                    }`}
                >
                  {items.map((item) => (
                    <ActionItem key={`${resultsKey}-${item.id}`} item={item} />
                  ))}
                </CollapsibleActionsGroup>
              );
            })}
          </Box>

          {query.length > 0 && loading && <Loading loaderHeight="5vh" />}

          {showEmpty && (
            <Spotlight.Empty>
              {query.length === 0
                ? "Search for any Workspaces, Snippets or WorkItems!"
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
