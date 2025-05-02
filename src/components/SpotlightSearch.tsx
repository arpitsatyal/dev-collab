import { spotlight, Spotlight } from "@mantine/spotlight";
import { IconFolder, IconSearch } from "@tabler/icons-react";
import {
  useGetProjectsQuery,
  useLazyGetProjectQuery,
} from "../store/api/projectApi";
import Loading from "./Loader";
import { truncateByWords } from "../utils/truncateByWords";
import { useRouter } from "next/router";
import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { useSearch } from "../hooks/useSearch";
import React, { useEffect, useMemo, useState } from "react";
import { Project, Snippet } from "@prisma/client";
import FileIcon from "./FileIcon";

interface IData {
  projectId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  snippetId?: string;
}

const SpotlightSearch = () => {
  const router = useRouter();
  const { data: projects = [], isLoading } = useGetProjectsQuery();
  const [triggerGetProject] = useLazyGetProjectQuery();
  const [query, setQuery] = useState("");

  const { matchedResults, loading } = useSearch(query);
  const [loadedProjects, setLoadedProjects] = useState<Record<string, Project>>(
    {}
  );

  const projectData: IData[] = useMemo(
    () =>
      projects
        .filter((project) =>
          project.title.toLowerCase().includes(query.toLowerCase().trim())
        )
        .map((project) => ({
          projectId: project.id,
          title: project.title,
          description: project.description ?? "-",
          icon: <IconFolder size={24} stroke={1.5} />,
        })),
    [projects, query]
  );

  const snippetData: IData[] = useMemo(() => {
    if (!matchedResults?.length) return [];

    return matchedResults.map((result) => {
      const snippet: Snippet = result._source;
      return {
        projectId: snippet.projectId,
        snippetId: result._id,
        title: `${snippet.title}.${snippet.extension ?? ""}`,
        description: snippet.language,
        icon: <FileIcon snippet={snippet} />,
        type: "snippet",
      };
    });
  }, [matchedResults]);

  useEffect(() => {
    const fetchMissingProjects = async () => {
      const toFetch = snippetData.filter(
        (snippet) => !loadedProjects[snippet.projectId]
      );

      for (const snippet of toFetch) {
        const localProject = projects.find((p) => p.id === snippet.projectId);
        if (localProject) {
          setLoadedProjects((prev) => ({
            ...prev,
            [snippet.projectId]: localProject,
          }));
        } else {
          try {
            const response = await triggerGetProject(snippet.projectId);
            if (response.data) {
              const project = response.data;
              setLoadedProjects((prev) => ({
                ...prev,
                [snippet.projectId]: project,
              }));
            }
          } catch (err) {
            console.error("Failed to fetch project", err);
          }
        }
      }
    };

    if (snippetData.length > 0) {
      fetchMissingProjects();
    }
  }, [snippetData, projects, loadedProjects, triggerGetProject]);

  const handleQueryChange = (query: string) => {
    setQuery(query);
  };

  const snippetItems = snippetData.map((item) => {
    return (
      <Spotlight.Action>
        <Group wrap="nowrap" w="100%">
          {item.icon}

          <Box
            style={{ flex: 1 }}
            p={3}
            onClick={() =>
              router.push(
                `/projects/${item.projectId}/snippets/${item.snippetId}`
              )
            }
          >
            <Text>{item.title}</Text>

            <Group gap="xs">
              <IconFolder size={16} />
              <Text size="xs" opacity={0.6}>
                {loadedProjects[item.projectId]?.title ?? "Loading..."}
              </Text>
            </Group>
          </Box>
        </Group>
      </Spotlight.Action>
    );
  });

  const projectItems = projectData.map((item) => {
    return (
      <Spotlight.Action>
        <Group wrap="nowrap" w="100%">
          {item.icon}

          <Box
            style={{ flex: 1 }}
            p={3}
            onClick={() => router.push(`/projects/${item.projectId}`)}
          >
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
          ) : (
            <>
              {projectItems.length > 0 && (
                <Spotlight.ActionsGroup label="Projects">
                  {projectItems}
                </Spotlight.ActionsGroup>
              )}
              {snippetItems.length > 0 && query.length > 0 && (
                <Spotlight.ActionsGroup label="Snippets">
                  {snippetItems}
                </Spotlight.ActionsGroup>
              )}
              {projectItems.length === 0 && snippetItems.length === 0 && (
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
