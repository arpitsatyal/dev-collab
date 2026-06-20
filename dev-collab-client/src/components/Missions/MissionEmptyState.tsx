import { Card, Stack, Text } from "@mantine/core";
import { IconTarget } from "@tabler/icons-react";

export const MissionEmptyState = () => {
  return (
    <Card p="xl" radius="md" withBorder style={{ borderStyle: 'dashed', gridColumn: 'span 3' }} bg="transparent">
      <Stack align="center" gap="xs">
        <IconTarget size={48} color="var(--mantine-color-gray-4)" />
        <Text c="dimmed" fw={500}>No missions found</Text>
        <Text size="sm" c="dimmed">Start a new mission to see your agent in action!</Text>
      </Stack>
    </Card>
  );
};
