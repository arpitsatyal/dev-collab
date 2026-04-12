import BaseActionIcon from "../shared/base/BaseActionIcon";
import {  Box, NavLink, Text } from "@mantine/core";
import { IconBrandPagekit, IconPin, IconSubtask } from "@tabler/icons-react";
import { useRouter } from "next/router";
import BaseLoader from "../shared/base/BaseLoader";
import SnippetList from "../Snippets/SnippetList";
import { WorkspaceWithPin } from "../../types";
import { NavItemProps } from "../../hooks/useSideNav";
import { useSideNavContext } from "./SideNavContext";

interface WorkspaceNavItemProps {
  index: number;
  style: React.CSSProperties;
  workspace: WorkspaceWithPin;
  child: NavItemProps;
}

const WorkspaceNavItem = ({
  style,
  workspace,
  child }: WorkspaceNavItemProps) => {
  const router = useRouter();
  const {
    isActive,
    openItem,
    loadingWorkspaceId,
    setOpenItem,
    handleUpdatePinnedStatus,
    loadedSnippets,
    itemRefs } = useSideNavContext();

  const isExpanded = openItem === child.id;
  const isLoading = loadingWorkspaceId === child.id;
  
  const onToggle = (id: string) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

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
              whiteSpace: "nowrap" }}
          >
            {child.label}
          </Text>
        }
        ref={(el) => {
          if (itemRefs.current) {
            itemRefs.current[child.id] = el;
          }
        }}
        leftSection={<child.icon size={16} stroke={1.5} />}
        onClick={() => {
          onToggle(child.id);
        }}
      >
        <Box>
          {isLoading ? (
            <BaseLoader loaderHeight="5vh" />
          ) : (
            <>
              <BaseActionIcon
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePinnedStatus(workspace);
                }}
                style={(theme) => ({
                    color: workspace.isPinned
                      ? theme.colors.yellow[5]
                      : theme.colors.gray[5],
                    "&:hover": {
                      color: theme.colors.yellow[7] },
                    padding: 5 })}
              >
                <IconPin size={16} />
              </BaseActionIcon>

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
