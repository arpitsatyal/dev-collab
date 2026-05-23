import { Group, Box, Title, Text, Button, Breadcrumbs, Anchor, ActionIcon, Tooltip } from "@mantine/core";
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
      <Breadcrumbs mb="xl" separator={<IconChevronRight size={14} />}>
        {breadcrumbs}
      </Breadcrumbs>

      <Group justify="space-between" mb="xl" align="flex-end">
        <Box>
          <Group gap="sm" align="center" mb={4}>
            <Title fz={32} fw={800} style={{ letterSpacing: '-0.5px' }}>Mission Control 🎯</Title>
            <Tooltip label={isExplainerOpen ? "Hide Guide" : "Show Agent Guide"}>
              <ActionIcon
                variant={isExplainerOpen ? "filled" : "light"}
                color="indigo"
                radius="xl"
                size="md"
                onClick={onToggleExplainer}
                style={{
                  boxShadow: !isExplainerOpen ? "0 0 0 0 rgba(92, 124, 250, 0.7)" : "none",
                  animation: !isExplainerOpen ? "pulse 2s infinite" : "none",
                }}
              >
                <IconInfoCircle size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
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
