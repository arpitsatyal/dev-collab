import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { IconMessage } from "@tabler/icons-react";
import { useAppDispatch } from "../../../store/hooks";
import { setWorkspacesOpen } from "../../../store/slices/workspaceSlice";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { getDisplayTitle } from "../../../utils/search";
import { ChatWithMessages, TypedItems } from "../../../types";

export const ChatSearchGroup = () => {
  const { matchedResults, isSearchLoading, addRecentItems } =
    useSpotlightSearchContext();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const items = useMemo(() => {
    const apiChats =
      !isSearchLoading && matchedResults?.length > 0
        ? (matchedResults.filter(
          (apiResult: TypedItems) => apiResult.type === "chat"
        ) as ChatWithMessages[])
        : [];

    return apiChats.map((chat) => ({
      id: chat.id,
      title: getDisplayTitle({ ...chat, type: "chat" } as TypedItems),
      icon: <IconMessage size={24} stroke={1.5} />,
      onClick: () => {
        dispatch(setWorkspacesOpen(true));
        addRecentItems([{ ...chat, type: "chat" } as TypedItems]);
        router.push(`/chats/${chat.id}`);
      },
      groupLabel: "Chats",
    } as DataItem));
  }, [matchedResults, isSearchLoading, addRecentItems, dispatch, router]);

  if (!items.length) return null;

  return (
    <CollapsibleActionsGroup
      label="Chats"
      groupLabel={`${items.length} ${items.length === 1 ? "Result" : "Results"}`}
    >
      {items.map((item) => (
        <ActionItem key={item.id} item={item} />
      ))}
    </CollapsibleActionsGroup>
  );
};
