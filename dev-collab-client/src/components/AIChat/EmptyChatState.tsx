import BaseButton from "../shared/base/BaseButton";
import { Group, Stack, Text } from "@mantine/core";
import styles from "./AIChat.module.css";
import { useRouter } from "next/router";

interface EmptyChatStateProps {
  onSendMessage: (content: string) => void;
}

const EmptyChatState = ({ onSendMessage }: EmptyChatStateProps) => {
  const router = useRouter();
  const isDashboard = router.pathname === "/dashboard";

  return (
    <Stack className={styles.emptyChat} justify="flex-end">
      <Text fw={500}>How can I help you?</Text>
      {isDashboard && (
        <Group wrap="wrap" gap="xs">
          <BaseButton
            variant="outline"
            size="sm"
            radius="xl"
            onClick={() => onSendMessage("How do I get started?")}
            className={styles.suggestionButton}
          >
            How can I get started?
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            radius="xl"
            onClick={() => onSendMessage("How to create a new Documentation?")}
            className={styles.suggestionButton}
          >
            How to Create a new Doc?
          </BaseButton>
        </Group>
      )}
    </Stack>
  );
};

export default EmptyChatState;
