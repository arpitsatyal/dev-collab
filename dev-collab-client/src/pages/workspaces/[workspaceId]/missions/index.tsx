import { Container, Title, Text, Box, Group, Button, Card, Badge, Stack, SimpleGrid, Modal, TextInput, Breadcrumbs, Anchor } from "@mantine/core";
import { IconPlus, IconTarget, IconChevronRight } from "@tabler/icons-react";
import Layout from "../../../../components/Layout/Layout";
import { withAuth } from "../../../../guards/withAuth";
import { useGetMissionsQuery, Mission, useCreateMissionMutation } from "../../../../store/api/missionApi";
import { useState } from "react";
import BaseLoader from "../../../../components/shared/base/BaseLoader";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { notifications } from "@mantine/notifications";
import Link from "next/link";

dayjs.extend(relativeTime);

const WorkspaceMissions = () => {
  const router = useRouter();
  const { workspaceId } = router.query;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missionGoal, setMissionGoal] = useState("");
  const [createMission, { isLoading: isCreating }] = useCreateMissionMutation();

  const { data: missions, isLoading: isLoadingMissions } = useGetMissionsQuery(workspaceId as string, {
    skip: !workspaceId,
  });

  const handleStartMission = async () => {
     if (!workspaceId || !missionGoal) return;
     try {
       const mission = await createMission({ workspaceId: workspaceId as string, goal: missionGoal }).unwrap();
       setIsModalOpen(false);
       setMissionGoal("");
       router.push(`/workspaces/${workspaceId}/missions/${mission.id}`);
     } catch (error) {
       notifications.show({ title: "Error", message: "Failed to start mission", color: "red" });
     }
  };

  const breadcrumbs = [
    { title: 'Workspace', href: `/workspaces/${workspaceId}` },
    { title: 'Missions', href: `/workspaces/${workspaceId}/missions` },
  ].map((item, index) => (
    <Anchor component={Link} href={item.href} key={index} size="sm">
      {item.title}
    </Anchor>
  ));

  if (!workspaceId) return <BaseLoader />;

  return (
    <Container size="xl" py="xl">
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
          onClick={() => setIsModalOpen(true)}
          bg="blue.6"
          size="md"
        >
          New Mission
        </Button>
      </Group>

      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initiate New Agent Mission" radius="md">
        <Stack>
            <TextInput 
              label="What is the mission goal?" 
              placeholder="e.g. Refactor the authentication snippets"
              value={missionGoal}
              onChange={(e) => setMissionGoal(e.currentTarget.value)}
              required
              data-autofocus
            />
            <Button onClick={handleStartMission} loading={isCreating} fullWidth radius="md" size="md">Launch Mission</Button>
        </Stack>
      </Modal>

      {isLoadingMissions ? (
        <BaseLoader />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {missions?.map((mission: Mission) => (
            <Card 
              key={mission.id} 
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder 
              className="hover-card"
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
              onClick={() => router.push(`/workspaces/${workspaceId}/missions/${mission.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
                  <Text size="xs" c="dimmed">
                    {dayjs(mission.createdAt).fromNow()}
                  </Text>
                </Group>
                <Title order={4} lineClamp={2} style={{ lineHeight: 1.4 }}>{mission.goal}</Title>
              </Stack>
            </Card>
          ))}
          {(!missions || missions.length === 0) && (
             <Card p="xl" radius="md" withBorder style={{ borderStyle: 'dashed', gridColumn: 'span 3' }} bg="transparent">
                <Stack align="center" gap="xs">
                    <IconTarget size={48} color="var(--mantine-color-gray-4)" />
                    <Text c="dimmed" fw={500}>No missions found</Text>
                    <Text size="sm" c="dimmed">Start a new mission to see your agent in action!</Text>
                </Stack>
             </Card>
          )}
        </SimpleGrid>
      )}
    </Container>
  );
};

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

WorkspaceMissions.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default WorkspaceMissions;
