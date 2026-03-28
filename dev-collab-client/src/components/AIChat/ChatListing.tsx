import {
  ActionIcon,
  Box,
  Button,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  Loader,
  Group,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import styles from "./AIChat.module.css";
import Loading from "../Loader/Loader";
import dayjs from "dayjs";
import { useGetChatsQuery } from "../../store/api/chatApi";

interface ChatListingProps {
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

const ChatListing = ({ onSelectChat, onDeleteChat }: ChatListingProps) => {
  const {
    data: chats = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetChatsQuery();

  const isInitialLoading = isLoading && chats.length === 0;

  if (isInitialLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <Text c="red">Error: {error.toString()}</Text>
      </div>
    );
  }

  return (
    <ScrollArea className={styles.chatListing}>
      <Stack gap="sm" p="md">
        {isFetching && chats.length > 0 && (
          <Group gap="xs" justify="flex-start" align="center" px="xs">
            <Loader size="xs" />
            <Text size="xs" c="dimmed">
              Refreshing chats…
            </Text>
          </Group>
        )}
        {chats.map((chat) => {
          const userMessage = chat.messages
            ? [...chat.messages]
              .sort(
                (a, b) =>
                  dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
              )
              .find((msg) => msg.isUser === true)
            : undefined;

          return (
            <Box key={chat.id} className={styles.chatItem}>
              <Button
                variant="subtle"
                onClick={() => onSelectChat(chat.id)}
                className={styles.chatItemButton}
                fullWidth
                justify="space-between"
              >
                <Stack gap={4}>
                  <Text fw={500} truncate>
                    {userMessage?.content ?? "Untitled"}
                  </Text>
                  <Text size="xs" className="secondary">
                    {dayjs(chat.createdAt).format("MMM D, YYYY")}{" "}
                  </Text>
                </Stack>
              </Button>
              <Tooltip label="Delete chat">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => {
                    onDeleteChat(chat.id);
                  }}
                  className={styles.deleteButton}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Box>
          );
        })}
      </Stack>
    </ScrollArea>
  );
};

export default ChatListing;
