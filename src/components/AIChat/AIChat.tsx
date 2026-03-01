import { ActionIcon, Box, Button, Group, Popover, Stack } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import {
  IconChevronLeft,
  IconPlus,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import styles from "./AIChat.module.css";
import {
  useCreateChatMutation,
  useDeleteChatMutation,
} from "../../store/api/chatApi";
import ChatListing from "./ChatListing";
import ChatMessages from "./ChatMessages";

const AIChat = () => {
  const [chatId, setChatId] = useState("");
  const [showListing, setShowListing] = useState(false);
  const [input, setInput] = useState("");
  const [opened, setOpened] = useState(false);

  const [createChat, { isLoading: isCreatingChat }] = useCreateChatMutation();
  const [deleteChatMutation] = useDeleteChatMutation();

  const addNewChat = useCallback(async () => {
    if (isCreatingChat) return;
    try {
      const response = await createChat().unwrap();
      setChatId(response.id);
      setShowListing(false);
      setInput("");
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  }, [isCreatingChat, createChat, setChatId, setShowListing, setInput]);

  useEffect(() => {
    if (opened && !chatId && !isCreatingChat) {
      addNewChat();
    }
  }, [opened, chatId, addNewChat, isCreatingChat]);

  const handleTogglePopover = () => {
    setOpened((prev) => !prev);
  };

  const handleClose = () => {
    setOpened(false);
    setChatId("");
    setInput("");
    setShowListing(false);
  };

  const goToChat = (id: string) => {
    setChatId(id);
    setShowListing(false);
  };

  const deleteChat = async (id: string) => {
    try {
      await deleteChatMutation(id).unwrap();
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  return (
    <Box className={styles.aiWidgetContainer}>
      <Popover
        position="top-end"
        offset={16}
        withArrow
        shadow="md"
        radius="lg"
        width="50%"
        middlewares={{ flip: true, shift: true }}
        opened={opened}
        onChange={setOpened}
      >
        <Popover.Target>
          <ActionIcon
            className={styles.triggerButton}
            aria-label="Open Dev-Collab Assistant"
            size="xl"
            radius="xl"
            onClick={handleTogglePopover}
          >
            <IconSparkles size={28} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown className={styles.popoverContent}>
          <Stack className={styles.contentWrapper}>
            <Group justify="space-between" align="center" px="md" pt="md">
              {!showListing ? (
                <Button
                  onClick={() => setShowListing(!showListing)}
                  leftSection={<IconChevronLeft size={16} />}
                  variant="subtle"
                  size="sm"
                  className={styles.chatButton}
                >
                  Chats
                </Button>
              ) : null}
              <Group gap="xs">
                <Button
                  onClick={addNewChat}
                  leftSection={<IconPlus size={16} />}
                  variant="subtle"
                  size="sm"
                  className={styles.chatButton}
                  disabled={isCreatingChat}
                >
                  New chat
                </Button>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  radius="xl"
                  aria-label="Close"
                  className={styles.closeButton}
                  onClick={handleClose}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Group>
            <Box className={styles.chatArea}>
              {showListing ? (
                <ChatListing
                  onSelectChat={goToChat}
                  onDeleteChat={deleteChat}
                />
              ) : (
                <ChatMessages
                  chatId={chatId}
                  setInput={setInput}
                  input={input}
                />
              )}
            </Box>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Box>
  );
};

export default AIChat;
