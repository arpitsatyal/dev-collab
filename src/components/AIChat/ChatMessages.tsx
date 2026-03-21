import {
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Skeleton,
  Tooltip,
} from "@mantine/core";
import {
  useGetChatQuery,
  useAskAIMutation,
} from "../../store/api/chatApi";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
  useRef,
} from "react";
import { v4 as uuidv4 } from "uuid";
import styles from "./AIChat.module.css";
import { useSession } from "next-auth/react";
import { extractDate, extractTime } from "../../utils/dateUtils";
import MarkdownContent from "../shared/MarkdownContent";
import { useRouter } from "next/router";
import Image from "next/image";
import Loading from "../Loader/Loader";

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
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const image = session?.user?.image || "/user.png";

  const {
    data: chatData,
    isLoading: isChatLoading,
    isFetching: isChatFetching,
    isError: isChatError,
    error: chatError,
  } = useGetChatQuery(chatId, {
    skip: !chatId,
  });
  const [askAI, { isLoading }] = useAskAIMutation();

  useEffect(() => {
    if (chatData?.messages) {
      setMessages(chatData.messages);
    } else if (chatId) {
      setMessages([]);
    }
  }, [chatData]);

  const isInitialLoading = Boolean(chatId) && (isChatLoading || (isChatFetching && !chatData));

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: uuidv4(),
      content,
      isUser: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    const workspaceId = router.query.workspaceId as string;

    try {
      const response = await askAI({
        chatId,
        question: content,
        workspaceId,
      }).unwrap();

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: response.answer,
          isUser: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [messages]);

  if (isInitialLoading) {
    return (
      <Box className={styles.chatContainer}>
        <Loading loaderHeight="100%" />
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
        {messages.length <= 0 && (
          <Stack className={styles.emptyChat} justify="flex-end">
            <Text fw={500}>How can I help you?</Text>
            <Group wrap="wrap" gap="xs">
              <Button
                variant="outline"
                size="sm"
                radius="xl"
                onClick={() => sendMessage("How do I get started?")}
                className={styles.suggestionButton}
              >
                How can I get started?
              </Button>
              <Button
                variant="outline"
                size="sm"
                radius="xl"
                onClick={() =>
                  sendMessage("How to create a new Documentation?")
                }
                className={styles.suggestionButton}
              >
                How to Create a new Doc?
              </Button>
            </Group>
          </Stack>
        )}
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
            <div
              ref={index === messages.length - 1 ? lastMessageRef : null}
              key={message.id}
              className={`${styles.messageContainer} ${message.isUser
                ? styles.userMessageContainer
                : styles.botMessageContainer
                }`}
            >
              <Image
                src={message.isUser ? image : "/probot.png"}
                className={styles.avatarImage}
                alt={message.isUser ? "User Avatar" : "AI Avatar"}
                width={40}
                height={40}
              />

              <div
                className={`${styles.messageContent} ${message.isUser ? styles.userMessage : styles.botMessage
                  }`}
              >
                {/* Use MarkdownContent for rendering content with syntax highlighting */}
                <div className={styles.markdownContent}>
                  <MarkdownContent content={message.content} />
                </div>
              </div>

              <Tooltip label={extractDate(message.createdAt)} withArrow>
                <Text size="xs" c="dimmed" className={styles.timeText}>
                  {extractTime(message.createdAt)}
                </Text>
              </Tooltip>
            </div>
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
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
          className={styles.input}
        />
        <Button type="submit" disabled={isLoading || !input.trim()} size="sm">
          Send
        </Button>
      </form>
    </Box>
  );
};

export default ChatMessages;
