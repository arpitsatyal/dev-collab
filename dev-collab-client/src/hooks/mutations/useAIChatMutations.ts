import { useCallback } from "react";
import {
  useCreateChatMutation,
  useDeleteChatMutation,
} from "../../store/api/chatApi";

interface UseAIChatMutationsProps {
  setChatId: React.Dispatch<React.SetStateAction<string>>;
  setShowListing: React.Dispatch<React.SetStateAction<boolean>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

export const useAIChatMutations = ({
  setChatId,
  setShowListing,
  setInput,
}: UseAIChatMutationsProps) => {
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

  const deleteChat = useCallback(
    async (id: string) => {
      try {
        await deleteChatMutation(id).unwrap();
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    },
    [deleteChatMutation],
  );

  return {
    addNewChat,
    deleteChat,
    isCreatingChat,
  };
};
