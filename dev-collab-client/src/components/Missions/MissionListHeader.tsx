import { Group, Box, Title, Text, Button, Breadcrumbs, Anchor, Tooltip } from "@mantine/core";
import { IconPlus, IconChevronRight, IconInfoCircle } from "@tabler/icons-react";
import Link from "next/link";

interface MissionListHeaderProps {
  workspaceId: string;
  onNewMission: () => void;
  isExplainerOpen: boolean;
  onToggleExplainer: () => void;
}

export const MissionListHeader = ({
  workspaceId,
  onNewMission,
  isExplainerOpen,
  onToggleExplainer,
}: MissionListHeaderProps) => {
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
      <Group justify="space-between" mb="xl">
        <Breadcrumbs separator={<IconChevronRight size={14} />}>
          {breadcrumbs}
        </Breadcrumbs>

        <Tooltip label={isExplainerOpen ? "Hide Guide" : "Show Agent Guide"}>
          <Button
            leftSection={<IconInfoCircle size={18} />}
            variant={isExplainerOpen ? "filled" : "light"}
            color="indigo"
            radius="md"
            onClick={onToggleExplainer}
            size="sm"
            style={{
              boxShadow: !isExplainerOpen ? "0 0 0 0 rgba(92, 124, 250, 0.4)" : "none",
              animation: !isExplainerOpen ? "pulse 2s infinite" : "none",
            }}
          >
            Agent Guide
          </Button>
        </Tooltip>
      </Group>

      <Group justify="space-between" mb="xl" align="flex-end">
        <Box>
          <Title fz={32} fw={800} mb={4} style={{ letterSpacing: '-0.5px' }}>Mission Control 🎯</Title>
          <Text c="dimmed">Manage and monitor autonomous agent missions for this workspace.</Text>
        </Box>
        <Group gap="sm">
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
      </Group>

      {/* Inline styles for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(92, 124, 250, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(92, 124, 250, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(92, 124, 250, 0);
          }
        }
      `}</style>
    </>
  );
};
