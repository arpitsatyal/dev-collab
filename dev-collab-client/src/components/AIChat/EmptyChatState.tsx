import { Button, Group, Stack, Text } from "@mantine/core";
import styles from "./AIChat.module.css";

interface EmptyChatStateProps {
  onSendMessage: (content: string) => void;
}

const EmptyChatState = ({ onSendMessage }: EmptyChatStateProps) => {
  return (
    <Stack className={styles.emptyChat} justify="flex-end">
      <Text fw={500}>How can I help you?</Text>
      <Group wrap="wrap" gap="xs">
        <Button
          variant="outline"
          size="sm"
          radius="xl"
          onClick={() => onSendMessage("How do I get started?")}
          className={styles.suggestionButton}
        >
          How can I get started?
        </Button>
        <Button
          variant="outline"
          size="sm"
          radius="xl"
          onClick={() => onSendMessage("How to create a new Documentation?")}
          className={styles.suggestionButton}
        >
          How to Create a new Doc?
        </Button>
      </Group>
    </Stack>
  );
};

export default EmptyChatState;
