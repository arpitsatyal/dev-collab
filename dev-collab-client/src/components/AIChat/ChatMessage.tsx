import BaseTooltip from "../shared/base/BaseTooltip";
import { Group, Text } from "@mantine/core";
import Image from "next/image";
import styles from "./AIChat.module.css";
import MarkdownContent from "../shared/MarkdownContent";
import { extractDate, extractTime } from "../../utils/common/date";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  image: string;
  createdAt: string | Date;
  lastMessageRef?: React.RefObject<HTMLDivElement>;
}

const ChatMessage = ({
  content,
  isUser,
  image,
  createdAt,
  lastMessageRef,
}: ChatMessageProps) => {
  return (
    <div
      ref={lastMessageRef}
      className={`${styles.messageContainer} ${
        isUser ? styles.userMessageContainer : styles.botMessageContainer
      }`}
    >
      <Image
        src={isUser ? image : "/probot.png"}
        className={styles.avatarImage}
        alt={isUser ? "User Avatar" : "AI Avatar"}
        width={40}
        height={40}
      />

      <div
        className={`${styles.messageContent} ${
          isUser ? styles.userMessage : styles.botMessage
        }`}
      >
        <div className={styles.markdownContent}>
          <MarkdownContent content={content} />
        </div>
      </div>

      <BaseTooltip label={extractDate(createdAt)} withArrow>
        <Text size="xs" c="dimmed" className={styles.timeText}>
          {extractTime(createdAt)}
        </Text>
      </BaseTooltip>
    </div>
  );
};

export default ChatMessage;
