import BasePopover from "../shared/base/BasePopover";
import BaseActionIcon from "../shared/base/BaseActionIcon";
import BaseButton from "../shared/base/BaseButton";
import { Box, Group, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import {
  IconChevronLeft,
  IconPlus,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import styles from "./AIChat.module.css";
import { useAIChatMutations } from "../../hooks/mutations/useAIChatMutations";
import ChatListing from "./ChatListing";
import ChatMessages from "./ChatMessages";

const AIChat = () => {
  const [chatId, setChatId] = useState("");
  const [showListing, setShowListing] = useState(false);
  const [input, setInput] = useState("");
  const [opened, setOpened] = useState(false);

  const { addNewChat, deleteChat, isCreatingChat } = useAIChatMutations({
    setChatId,
    setShowListing,
    setInput,
  });

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

  return (
    <Box className={styles.aiWidgetContainer}>
      <BasePopover
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
        <BasePopover.Target>
          <BaseActionIcon
            className={styles.triggerButton}
            aria-label="Open Dev-Collab Assistant"
            size="xl"
            radius="xl"
            onClick={handleTogglePopover}
          >
            <IconSparkles size={28} />
          </BaseActionIcon>
        </BasePopover.Target>
        <BasePopover.Dropdown className={styles.popoverContent}>
          <Stack className={styles.contentWrapper}>
            <Group justify="space-between" align="center" px="md" pt="md">
              {!showListing ? (
                <BaseButton
                  onClick={() => setShowListing(!showListing)}
                  leftSection={<IconChevronLeft size={16} />}
                  variant="subtle"
                  size="sm"
                  className={styles.chatButton}
                >
                  Chats
                </BaseButton>
              ) : null}
              <Group gap="xs">
                <BaseButton
                  onClick={addNewChat}
                  leftSection={<IconPlus size={16} />}
                  variant="subtle"
                  size="sm"
                  className={styles.chatButton}
                  disabled={isCreatingChat}
                >
                  New chat
                </BaseButton>
                <BaseActionIcon
                  variant="subtle"
                  size="lg"
                  radius="xl"
                  aria-label="Close"
                  className={styles.closeButton}
                  onClick={handleClose}
                >
                  <IconX size={16} />
                </BaseActionIcon>
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
        </BasePopover.Dropdown>
      </BasePopover>
    </Box>
  );
};

export default AIChat;
