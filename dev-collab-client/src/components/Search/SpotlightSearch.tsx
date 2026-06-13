import BaseButton from "../shared/base/BaseButton";
import React, { useState, useMemo, useCallback } from "react";
import { IconSearch, IconClearAll } from "@tabler/icons-react";
import {
  Box,
  Text,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { useAppSelector } from "../../store/hooks";
import { useSearch } from "../../hooks/useSearch";
import BaseLoader from "../shared/base/BaseLoader";
import classes from "./SpotlightSearch.module.css";
import { useRecentItems } from "../../hooks/useRecentItems";
import { TypedItems } from "../../types";
import { useSession } from "../providers/AuthProvider";
import BaseRingLoader from "../shared/base/BaseRingLoader";
import { useGetWorkspacesQuery } from "../../store/api/workspaceApi";
import { uniqBy } from "lodash";
import SpotlightInput from "./SpotlightInput";
import { SpotlightSearchProvider } from "./SearchContext";
import { WorkspaceSearchGroup } from "./groups/WorkspaceSearchGroup";
import { SnippetSearchGroup } from "./groups/SnippetSearchGroup";
import { WorkItemSearchGroup } from "./groups/WorkItemSearchGroup";
import { DocSearchGroup } from "./groups/DocSearchGroup";
import { ChatSearchGroup } from "./groups/ChatSearchGroup";
import { RecentSearchGroup } from "./groups/RecentSearchGroup";

const SpotlightSearch = ({
  isSmallScreen = false,
}: {
  isSmallScreen: boolean;
}) => {
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
    error: searchError,
  } = useSearch(query);

  const { data: session } = useSession();
  const userId = session?.user?.id ?? undefined;
  const { recentSearchOrder, addRecentItems, clearRecentItems } =
    useRecentItems(userId);

  const snippets = Object.values(
    useAppSelector((state) => state.snippet.loadedSnippets),
  ).flat();

  const computedColorScheme = useComputedColorScheme();
  const theme = useMantineTheme();

  const searchCacheArray = Array.from(searchCache.values()).flat();
  const uniqueCacheResults = uniqBy(searchCacheArray, "id");

  const recentItems = useMemo(() => {
    const itemsMap = new Map<string, TypedItems>();

    recentSearchOrder.forEach((key) => {
      const [type, id] = key.split(":");
      let item;

      switch (type) {
        case "workspace":
          item = loadedWorkspaces?.find((w) => w.id === id);
          break;
        case "snippet":
          item = snippets.find((s) => s.id === id);
          break;
      }

      if (!item) {
        item = uniqueCacheResults.find((r) => r.type === type && r.id === id);
      }

      if (item) {
        itemsMap.set(key, { ...item, type } as TypedItems);
      }
    });

    return recentSearchOrder
      .map((key) => itemsMap.get(key))
      .filter((item): item is TypedItems => !!item);
  }, [recentSearchOrder, loadedWorkspaces, snippets, uniqueCacheResults]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const searchContextValue = useMemo(
    () => ({
      query,
      matchedResults,
      isSearchLoading,
      workspaces: loadedWorkspaces,
      snippets,
      recentSearchOrder,
      recentItems,
      addRecentItems,
    }),
    [
      query,
      matchedResults,
      isSearchLoading,
      loadedWorkspaces,
      snippets,
      recentSearchOrder,
      recentItems,
      addRecentItems,
    ],
  );

  const isEmptyQuery = query.length === 0;
  const showClearAll = recentItems.length > 0 && isEmptyQuery;
  const isLoading = isWorkspacesLoading || isSearchLoading;
  const isSearching = !isEmptyQuery && (isLoading || isTyping);

  const hasResults =
    matchedResults.length > 0 ||
    (loadedWorkspaces?.some((w) =>
      w.title.toLowerCase().includes(query.toLowerCase()),
    ) ??
      false) ||
    snippets.some((s) => s.title.toLowerCase().includes(query.toLowerCase()));

  const showEmptyState =
    !searchError && !isLoading && !isTyping && !isEmptyQuery && !hasResults;

  const strokeColor =
    computedColorScheme === "dark"
      ? theme.colors.dark[0]
      : theme.colors.dark[3];

  return (
    <SpotlightSearchProvider value={searchContextValue}>
      <SpotlightInput isSmallScreen={isSmallScreen} />
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
                <BaseButton
                  size="xs"
                  variant="light"
                  radius="xl"
                  onClick={clearRecentItems}
                  leftSection={<IconClearAll size={16} />}
                >
                  Clear All
                </BaseButton>
              </Box>
            )}

            {ringLoader && (
              <Box className={classes.clearAll}>
                <BaseRingLoader style={{ stroke: strokeColor }} />
              </Box>
            )}

            <WorkspaceSearchGroup />
            <SnippetSearchGroup />
            <WorkItemSearchGroup />
            <DocSearchGroup />
            <ChatSearchGroup />
            <RecentSearchGroup />
          </Box>

          {isEmptyQuery && (
            <Box p="xl">
              <Text ta="center" size="sm" opacity={0.5}>
                Search for any Workspaces, Snippets, Docs or WorkItems!
              </Text>
            </Box>
          )}

          {isSearching && (
            <Box p="xl">
              <BaseLoader loaderHeight="5vh" />
              <Text ta="center" size="sm" mt="sm" opacity={0.5}>
                Searching...
              </Text>
            </Box>
          )}

          {showEmptyState && (
            <Spotlight.Empty>Nothing found...</Spotlight.Empty>
          )}


          {searchError && (
            <Spotlight.Empty>
              <Box p="md">
                <Text color="red" size="sm" fw={500}>
                  {searchError}
                </Text>
              </Box>
            </Spotlight.Empty>
          )}

        </Spotlight.ActionsList>
      </Spotlight.Root>
    </SpotlightSearchProvider>
  );
};

export default SpotlightSearch;
