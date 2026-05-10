import React, { useMemo } from "react";
import { IconMessage } from "@tabler/icons-react";
import CollapsibleActionsGroup from "../CollapsibleActionsGroup";
import ActionItem, { DataItem } from "../ActionItem";
import { useSpotlightSearchContext } from "../SearchContext";
import { getDisplayTitle } from "../../../utils/search";
import { TypedItem, TypedItems } from "../../../types";
import { useSearchItemHandler } from "../../../hooks/useSearchItemHandler";

export const ChatSearchGroup = () => {
  const { matchedResults, isSearchLoading } = useSpotlightSearchContext();
  const { handleItemClick } = useSearchItemHandler();

  const mapChatToDataItem = (chat: TypedItem<"chat">): DataItem => ({
    id: chat.id,
    title: getDisplayTitle(chat),
    icon: <IconMessage size={24} stroke={1.5} />,
    onClick: () => handleItemClick(chat, `/chats/${chat.id}`),
    groupLabel: "Chats",
  });

  const items = useMemo(() => {
    if (isSearchLoading || !matchedResults?.length) return [];

    return matchedResults
      .filter((res: TypedItems): res is TypedItem<"chat"> => res.type === "chat")
      .map(mapChatToDataItem);
  }, [matchedResults, isSearchLoading, handleItemClick]);

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
