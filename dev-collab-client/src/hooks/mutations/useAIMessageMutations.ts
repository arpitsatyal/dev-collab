import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/router";
import { useAskAIMutation } from "../../store/api/chatApi";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string | Date;
}

interface UseAIMessageMutationsProps {
  chatId: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

export const useAIMessageMutations = ({
  chatId,
  setMessages,
  setInput,
}: UseAIMessageMutationsProps) => {
  const router = useRouter();
  const [askAI, { isLoading }] = useAskAIMutation();

  const sendMessage = useCallback(async (content: string) => {
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
  }, [chatId, setMessages, setInput, router.query.workspaceId, askAI]);

  return {
    sendMessage,
    isLoading,
  };
};
