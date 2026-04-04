import { ActionIcon, Box, NavLink, Text } from "@mantine/core";
import { IconBrandPagekit, IconPin, IconSubtask } from "@tabler/icons-react";
import { useRouter } from "next/router";
import Loading from "../Loader/Loader";
import SnippetList from "../Snippets/SnippetList";
import { WorkspaceWithPin } from "../../types";
import { NavItemProps } from "../../hooks/useSideNav";

interface WorkspaceNavItemProps {
  index: number;
  style: React.CSSProperties;
  workspace: WorkspaceWithPin;
  child: NavItemProps;
  isActive: (path?: string) => boolean;
  isExpanded: boolean;
  isLoading: boolean;
  onToggle: (id: string) => void;
  onUpdatePinnedStatus: (workspace: WorkspaceWithPin) => void;
  loadedSnippets: Record<string, any>;
  itemRef?: (el: HTMLAnchorElement | null) => void;
}

const WorkspaceNavItem = ({
  style,
  workspace,
  child,
  isActive,
  isExpanded,
  isLoading,
  onToggle,
  onUpdatePinnedStatus,
  loadedSnippets,
  itemRef,
}: WorkspaceNavItemProps) => {
  const router = useRouter();

  return (
    <Box style={style} key={child.id}>
      <NavLink
        key={child.id}
        active={isActive(child.path)}
        opened={isExpanded}
        label={
          <Text
            fz="sm"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {child.label}
          </Text>
        }
        ref={itemRef}
        leftSection={<child.icon size={16} stroke={1.5} />}
        onClick={() => {
          onToggle(child.id);
        }}
      >
        <Box>
          {isLoading ? (
            <Loading loaderHeight="5vh" />
          ) : (
            <>
              <ActionIcon
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePinnedStatus(workspace);
                }}
                style={(theme) => ({
                    color: workspace.isPinned
                      ? theme.colors.yellow[5]
                      : theme.colors.gray[5],
                    "&:hover": {
                      color: theme.colors.yellow[7],
                    },
                    padding: 5,
                  })}
              >
                <IconPin size={16} />
              </ActionIcon>

              <NavLink
                label="Work Items"
                active={isActive(`/workspaces/${child.id}/work-items`)}
                leftSection={<IconSubtask size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/workspaces/${child.id}/work-items`);
                }}
              />
              <NavLink
                label="Docs"
                active={router.pathname.includes("docs")}
                leftSection={<IconBrandPagekit size={16} />}
                onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/workspaces/${child.id}/docs`);
                }}
              />
              <SnippetList
                snippets={loadedSnippets[child.id] ?? []}
                isVisible={isExpanded && !!loadedSnippets[child.id]}
              />
            </>
          )}
        </Box>
      </NavLink>
    </Box>
  );
};

export default WorkspaceNavItem;
