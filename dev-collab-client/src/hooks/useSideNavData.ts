import { useMemo } from "react";
import { useAppSelector } from "../store/hooks";
import { useGetWorkspacesQuery } from "../store/api/workspaceApi";
import { uniqBy } from "lodash";
import { WorkspaceWithPin, Snippet, WorkItem } from "../types";
import {
  IconActivity,
  IconCloudDownload,
  IconGauge,
  IconPencil,
  IconPlayCard,
} from "@tabler/icons-react";

export interface NavItemProps {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path?: string;
  handler?: () => void;
  children?: (WorkspaceWithPin | NavItemProps)[];
  snippets?: Snippet[];
  workItems?: WorkItem[];
}

export const useSideNavData = () => {
  const { pageSize, skip, workspacesOpen, isInsertingWorkspace } = useAppSelector(
    (state) => state.workspace
  );

  const { data, isLoading, isFetching } = useGetWorkspacesQuery(
    { skip, limit: pageSize },
    { skip: !workspacesOpen }
  );

  const loadedWorkspaces = useMemo(() => data?.items || [], [data?.items]);
  const hasMore = data?.hasMore || false;

  const navItems = useMemo<NavItemProps[]>(
    () => [
      { id: "home", icon: IconGauge, label: "Home", path: "/dashboard" },
      { id: "playground", icon: IconPlayCard, label: "Playground", path: "/new" },
      { id: "create-workspace", icon: IconPencil, label: "Create Workspace", path: "/workspaces/create" },
      { id: "import-workspace", icon: IconCloudDownload, label: "Import from GitHub", path: "/workspaces/import" },
      { id: "workspaces", icon: IconActivity, label: "Workspaces", path: "/workspaces" },
    ],
    []
  );

  const navItemsWithWorkspaces = useMemo(() => {
    const items = [...navItems];
    const workspacesItem = items.find((item) => item.label === "Workspaces");
    if (workspacesItem) {
      const uniqueWorkspaces = uniqBy(loadedWorkspaces, "id");
      workspacesItem.children = uniqueWorkspaces;
    }
    return items;
  }, [navItems, loadedWorkspaces]);

  const workspaceNavItem = navItemsWithWorkspaces.find(
    (item) => item.label === "Workspaces"
  );
  const workspaceItems = useMemo(
    () => workspaceNavItem?.children || [],
    [workspaceNavItem?.children]
  );

  return {
    navItemsWithWorkspaces,
    workspaceItems,
    isLoading,
    isFetching,
    isInsertingWorkspace,
    hasMore,
    workspacesOpen
  };
};
