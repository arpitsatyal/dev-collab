import { Group, Box, Title, Text, Button, Breadcrumbs, Anchor } from "@mantine/core";
import { IconPlus, IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";

interface MissionListHeaderProps {
  workspaceId: string;
  onNewMission: () => void;
}

export const MissionListHeader = ({ workspaceId, onNewMission }: MissionListHeaderProps) => {
  const breadcrumbs = [
    { title: 'Workspace', href: `/workspaces/${workspaceId}` },
    { title: 'Mission Control', href: '#' },
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
          <Title fz={32} fw={800} style={{ letterSpacing: '-0.5px' }}>Mission Control 🎯</Title>
          <Text c="dimmed">Manage and monitor autonomous agent missions for this workspace.</Text>
        </Box>
        <Button
          leftSection={<IconPlus size={18} />}
          radius="md"
          onClick={onNewMission}
          bg="blue.6"
          size="md"
        >
          New Mission
        </Button>
      </Group>
    </>
  );
};
