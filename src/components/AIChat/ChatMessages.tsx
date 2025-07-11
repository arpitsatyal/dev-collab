import {
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import axios from "axios";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import styles from "./AIChat.module.css";

interface MessageProps {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string;
}

const ChatMessages = ({ chatId, input, setInput }: MessageProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;
      setIsFetching(true);
      try {
        const response = await axios.get(`/api/chats?chatId=${chatId}`);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchMessages();
  }, [chatId]);

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
    setIsLoading(true);

    try {
      const response = await axios.post(
        `/api/ai/ask?chatId=${chatId}`,
        {
          question: content,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: response.data.answer,
          isUser: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
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
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.isUser ? styles.userMessage : styles.botMessage
              }
            >
              <Text>{message.content}</Text>
            </div>
          ))}
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
