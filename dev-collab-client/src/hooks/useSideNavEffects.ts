import { useEffect, useRef, useCallback } from "react";
import { VariableSizeList } from "react-window";
import { useAppDispatch } from "../store/hooks";
import { setWorkspacesOpen } from "../store/slices/workspaceSlice";
import { WorkspaceWithPin } from "../types";
import type { NavItemProps } from "./useSideNavData";

interface SideNavEffectsProps {
  currentWorkspaceId: string | null;
  workspaceItems: (WorkspaceWithPin | NavItemProps)[];
  listRef: React.MutableRefObject<VariableSizeList | null>;
  openItem: string | null;
  setOpenItem: React.Dispatch<React.SetStateAction<string | null>>;
  loadedSnippets: Record<string, any>;
  fetchSnippets: (workspaceId: string) => void;
  pendingScrollId: string | null;
  setPendingScrollId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useSideNavEffects = ({
  currentWorkspaceId,
  workspaceItems,
  listRef,
  openItem,
  setOpenItem,
  loadedSnippets,
  fetchSnippets,
  pendingScrollId,
  setPendingScrollId,
}: SideNavEffectsProps) => {
  const lastWorkspaceIdRef = useRef<string | null>(null);
  const dispatch = useAppDispatch();

  const scrollItemIntoView = useCallback(
    (id: string) => {
      const index = workspaceItems.findIndex((item) => item.id === id);
      if (index === -1 || !listRef.current) return;

      const list = listRef.current as any;
      const itemStyle = list._getItemStyle(index);
      const itemOffsetTop = itemStyle.top;
      const itemHeight = itemStyle.height;

      const outerRef = list._outerRef as HTMLElement;
      const listHeight = outerRef.clientHeight;

      const itemCenter = itemOffsetTop + itemHeight / 2;
      const scrollTarget = itemCenter - listHeight / 2;

      outerRef.scrollTo({
        top: scrollTarget,
        behavior: "smooth",
      });
    },
    [workspaceItems, listRef]
  );

  const handleScrollToItem = useCallback(
    (id: string) => {
      const isValidId = workspaceItems.some((item) => item.id === id);
      if (!isValidId || !listRef.current) return;

      setOpenItem(id);
      dispatch(setWorkspacesOpen(true));
      scrollItemIntoView(id);
    },
    [workspaceItems, listRef, setOpenItem, scrollItemIntoView, dispatch]
  );

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [openItem, loadedSnippets, listRef]);

  useEffect(() => {
    if (!currentWorkspaceId || !workspaceItems.length) return;
    if (!workspaceItems.some((item) => item.id === currentWorkspaceId)) return;
    if (lastWorkspaceIdRef.current === currentWorkspaceId) return;

    const timeout = setTimeout(() => {
      handleScrollToItem(currentWorkspaceId);
      lastWorkspaceIdRef.current = currentWorkspaceId;
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentWorkspaceId, workspaceItems, handleScrollToItem]);

  useEffect(() => {
    if (!openItem || loadedSnippets[openItem]) return;
    fetchSnippets(openItem);
  }, [openItem, loadedSnippets, fetchSnippets]);

  useEffect(() => {
    if (!pendingScrollId) return;

    setOpenItem((prev) => (prev === pendingScrollId ? null : pendingScrollId));
    scrollItemIntoView(pendingScrollId);
    setPendingScrollId(null);
  }, [pendingScrollId, scrollItemIntoView, setOpenItem, setPendingScrollId]);

  return { scrollItemIntoView };
};
