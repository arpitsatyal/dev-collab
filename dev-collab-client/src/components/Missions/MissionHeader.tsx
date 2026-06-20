import { Group, Box, Title, Text, Badge, Breadcrumbs, Anchor } from "@mantine/core";
import { IconTarget, IconChevronRight } from "@tabler/icons-react";
import { Mission } from "../../store/api/missionApi";
import Link from "next/link";

interface MissionHeaderProps {
  mission: Mission;
  workspaceId: string;
}

const MissionHeader = ({ mission, workspaceId }: MissionHeaderProps) => {
  const breadcrumbs = [
    { title: 'Workspace', href: `/workspaces/${workspaceId}` },
    { title: 'Missions', href: `/workspaces/${workspaceId}/missions` },
    { title: 'HUD', href: '#' },
  ].map((item, index) => (
    <Anchor component={Link} href={item.href} key={index} size="sm">
      {item.title}
    </Anchor>
  ));

  return (
    <>
      <Breadcrumbs mb="xl" separator={<IconChevronRight size={14} />}>
        {breadcrumbs}
      </Breadcrumbs>

      <Group justify="space-between" mb="xl">
        <Box>
          <Group gap="xs">
            <IconTarget size={32} color="var(--mantine-color-blue-6)" />
            <Title order={1} fz={32} fw={800} style={{ letterSpacing: '-0.5px' }}>Mission HUD</Title>
          </Group>
          <Text c="dimmed" size="lg" mt="xs" fw={500}>Goal: {mission.goal}</Text>
        </Box>
        <Badge 
          size="xl" 
          radius="md" 
          variant="filled" 
          color={
            mission.status === 'COMPLETED' ? 'green.6' : 
            mission.status === 'RUNNING' ? 'blue.6' : 
            mission.status === 'FAILED' ? 'red.6' : 'gray.6'
          }
        >
          {mission.status}
        </Badge>
      </Group>
    </>
  );
};

export default MissionHeader;
