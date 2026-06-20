import { Card, Stack, Group, Badge, Title, Text } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { Mission } from "../../store/api/missionApi";

interface MissionCardProps {
  mission: Mission;
  workspaceId: string;
}

export const MissionCard = ({ mission, workspaceId }: MissionCardProps) => {
  const router = useRouter();

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
      onClick={() => router.push(`/workspaces/${workspaceId}/missions/${mission.id}`)}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Badge
            radius="sm"
            color={
              mission.status === 'COMPLETED' ? 'green.6' :
              mission.status === 'FAILED' ? 'red.6' :
              mission.status === 'RUNNING' ? 'blue.6' : 'gray.6'
            }
          >
            {mission.status}
          </Badge>
          <Text size="xs" c="dimmed">{dayjs(mission.createdAt).fromNow()}</Text>
        </Group>

        <Title order={3} fz="lg" fw={700} lineClamp={1}>
          {mission.goal}
        </Title>

        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">View HUD</Text>
          <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
        </Group>
      </Stack>
    </Card>
  );
};
