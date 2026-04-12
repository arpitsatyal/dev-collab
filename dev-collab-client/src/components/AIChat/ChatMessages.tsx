import {
  Box,
  ScrollArea,
  Group,
  Skeleton,
  Text,
  Stack } from "@mantine/core";
import {
  useGetChatQuery } from "../../store/api/chatApi";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
  useRef } from "react";
import styles from "./AIChat.module.css";
import BaseLoader from "../shared/base/BaseLoader";
import { useSession } from "../providers/AuthProvider";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import EmptyChatState from "./EmptyChatState";
import { useAIMessageMutations } from "../../hooks/mutations/useAIMessageMutations";

interface MessageProps {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string | Date;
}

const ChatMessages = ({ chatId, input, setInput }: MessageProps) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const image = session?.user?.image || "/user.png";

  const {
    data: chatData,
    isLoading: isChatLoading,
    isFetching: isChatFetching,
    isError: isChatError,
    error: chatError } = useGetChatQuery(chatId, {
    skip: !chatId });

  const { sendMessage, isLoading } = useAIMessageMutations({
    chatId,
    setMessages,
    setInput });

  useEffect(() => {
    if (chatData?.messages) {
      setMessages(chatData.messages);
    } else if (chatId) {
      setMessages([]);
    }
  }, [chatData, chatId]);

  const isInitialLoading = Boolean(chatId) && (isChatLoading || (isChatFetching && !chatData));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center" });
    }
  }, [messages]);

  if (isInitialLoading) {
    return (
      <Box className={styles.chatContainer}>
        <BaseLoader loaderHeight="100%" />
      </Box>
    );
  }

  if (isChatError) {
    return (
      <Box className={styles.chatContainer}>
        <Stack align="center" justify="center" style={{ height: "100%" }}>
          <Text c="red" fw={500}>
            Failed to load chat.
          </Text>
          {chatError && (
            <Text size="sm" c="dimmed">
              {chatError.toString()}
            </Text>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box className={styles.chatContainer}>
      <Box style={{ flexGrow: 1 }}>
        {messages.length <= 0 && <EmptyChatState onSendMessage={sendMessage} />}
        <ScrollArea className={styles.messageList}>
          {isChatFetching && chatData && (
            <Group gap="xs" pb="sm">
              <Skeleton height={8} width={8} radius="xl" />
              <Skeleton height={8} width={8} radius="xl" />
              <Skeleton height={8} width={8} radius="xl" />
              <Text size="xs" c="dimmed">
                Syncing latest messages…
              </Text>
            </Group>
          )}
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              isUser={message.isUser}
              image={image}
              createdAt={message.createdAt}
              lastMessageRef={index === messages.length - 1 ? (lastMessageRef as any) : undefined}
            />
          ))}

          {isLoading && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                AI is ruminating...
              </Text>

              <Group gap={4}>
                <Skeleton height={8} width={8} radius="xl" />
                <Skeleton height={8} width={8} radius="xl" />
                <Skeleton height={8} width={8} radius="xl" />
              </Group>
            </Group>
          )}
        </ScrollArea>
      </Box>
      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default ChatMessages;
