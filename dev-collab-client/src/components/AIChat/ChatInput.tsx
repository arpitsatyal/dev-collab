import BaseButton from "../shared/base/BaseButton";
import BaseTextarea from "../shared/base/BaseTextarea";
import { Dispatch, FormEvent, SetStateAction } from "react";
import styles from "./AIChat.module.css";

interface ChatInputProps {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

const ChatInput = ({ input, setInput, onSubmit, isLoading }: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.inputForm}>
      <BaseTextarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={isLoading}
        className={styles.input}
      />
      <BaseButton type="submit" disabled={isLoading || !input.trim()} size="sm">
        Send
      </BaseButton>
    </form>
  );
};

export default ChatInput;
