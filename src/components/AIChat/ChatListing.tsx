import {
  ActionIcon,
  Box,
  Button,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import styles from "./AIChat.module.css";
import axios from "axios";
import Loading from "../Loader/Loader";
import dayjs from "dayjs";
import { ChatWithMessages } from "../../types";

interface ChatListingProps {
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

const ChatListing = ({ onSelectChat, onDeleteChat }: ChatListingProps) => {
  const [chats, setChats] = useState<ChatWithMessages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("/api/chats");
        setChats(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch chats");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Text c="red">Error: {error}</Text>
      </div>
    );
  }

  return (
    <ScrollArea className={styles.chatListing}>
      <Stack gap="sm" p="md">
        {chats.map((chat) => {
          const userMessage = chat.messages?.find((msg) => msg.isUser === true);

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
                    setChats(chats.filter((c) => chat.id != c.id));
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
