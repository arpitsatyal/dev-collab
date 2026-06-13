import { Container, Title, Text, Box, Group, Button, Card, Badge, Stack, SimpleGrid, Modal, TextInput } from "@mantine/core";
import { IconTarget, IconPlus } from "@tabler/icons-react";
import Layout from "../../components/Layout/Layout";
import { withAuth } from "../../guards/withAuth";
import { useGetMissionsQuery, Mission, useCreateMissionMutation } from "../../store/api/missionApi";
import { useGetWorkspacesQuery } from "../../store/api/workspaceApi";
import { useState } from "react";
import BaseLoader from "../../components/shared/base/BaseLoader";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { notifications } from "@mantine/notifications";

dayjs.extend(relativeTime);

const MissionsDashboard = () => {
  const router = useRouter();
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useGetWorkspacesQuery({ limit: 100, skip: 0 });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missionGoal, setMissionGoal] = useState("");
  const [createMission, { isLoading: isCreating }] = useCreateMissionMutation();

  const workspaceId = selectedWorkspaceId || workspaces?.items[0]?.id;
  
  const { data: missions, isLoading: isLoadingMissions } = useGetMissionsQuery(workspaceId || "", {
    skip: !workspaceId,
  });

  const handleStartMission = async () => {
     if (!workspaceId || !missionGoal) return;
     try {
       const mission = await createMission({ workspaceId, goal: missionGoal }).unwrap();
       setIsModalOpen(false);
       setMissionGoal("");
       router.push(`/missions/${mission.id}`);
     } catch (error) {
       notifications.show({ title: "Error", message: "Failed to start mission", color: "red" });
     }
  };

  if (isLoadingWorkspaces) return <BaseLoader />;

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Title fz={26}>Mission Control 🎯</Title>
          <Text c="dimmed">Manage and monitor autonomous agent missions.</Text>
        </Box>
        <Button 
          leftSection={<IconPlus size={18} />} 
          radius="md" 
          onClick={() => setIsModalOpen(true)}
          bg="blue.6"
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
            />
            <Button onClick={handleStartMission} loading={isCreating} fullWidth radius="md">Launch Mission</Button>
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
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(`/missions/${mission.id}`)}
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Badge 
                    color={
                      mission.status === 'COMPLETED' ? 'green' : 
                      mission.status === 'FAILED' ? 'red' : 
                      mission.status === 'RUNNING' ? 'blue' : 'gray'
                    }
                  >
                    {mission.status}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {dayjs(mission.createdAt).fromNow()}
                  </Text>
                </Group>
                <Title order={4} lineClamp={2}>{mission.goal}</Title>
              </Stack>
            </Card>
          ))}
          {(!missions || missions.length === 0) && (
             <Text c="dimmed" fs="italic">No missions found. Start a new mission to begin.</Text>
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

MissionsDashboard.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default MissionsDashboard;
