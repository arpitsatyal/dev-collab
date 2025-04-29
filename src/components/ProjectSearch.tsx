import { spotlight, Spotlight, SpotlightActionData } from "@mantine/spotlight";
import { IconFolder, IconSearch } from "@tabler/icons-react";
import { useGetProjectsQuery } from "../store/api/projectApi";
import Loading from "./Loader";
import { truncateByWords } from "../utils/truncateByWords";
import { useRouter } from "next/router";
import { ActionIcon } from "@mantine/core";

const ProjectSearch = () => {
  const router = useRouter();
  const { data: projects = [], isLoading } = useGetProjectsQuery();

  const actions: SpotlightActionData[] = projects
    .filter((project) => project.id !== router.query?.projectId)
    .map((project) => ({
      id: project.id,
      label: project.title,
      description: project.description
        ? truncateByWords(project.description, 30)
        : "-",
      onClick: () => router.push(`/projects/${project.id}`),
      leftSection: <IconFolder size={24} stroke={1.5} />,
    }));

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

      <Spotlight
        actions={
          isLoading
            ? [
                {
                  id: "loading",
                  label: "Loading projects...",
                  description: "",
                  leftSection: <Loading loaderHeight="5vh" />,
                  onClick: () => {},
                  disabled: true,
                },
              ]
            : actions
        }
        nothingFound="Nothing found..."
        highlightQuery
        scrollable
        shortcut={["mod + K", "mod + P", "/"]}
        searchProps={{
          leftSection: <IconSearch size={20} stroke={1.5} />,
          placeholder: "Search...",
        }}
      />
    </>
  );
};

export default ProjectSearch;
