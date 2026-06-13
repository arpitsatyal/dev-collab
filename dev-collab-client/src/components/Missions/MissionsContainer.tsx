import { useState } from "react";
import { useRouter } from "next/router";
import { Container, SimpleGrid } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useGetMissionsQuery, Mission, useCreateMissionMutation } from "../../store/api/missionApi";
import BaseLoader from "../shared/base/BaseLoader";

import { MissionListHeader } from "./MissionListHeader";
import { CreateMissionModal } from "./CreateMissionModal";
import { MissionCard } from "./MissionCard";
import { MissionEmptyState } from "./MissionEmptyState";
import { MissionExplainer } from "./MissionExplainer";

dayjs.extend(relativeTime);

export const MissionsContainer = () => {
  const router = useRouter();
  const { workspaceId } = router.query;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missionGoal, setMissionGoal] = useState("");
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  const { data: missions, isLoading: isLoadingMissions } = useGetMissionsQuery(workspaceId as string, {
    skip: !workspaceId,
  });

  const [createMission, { isLoading: isCreating }] = useCreateMissionMutation();

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

  const handleSelectExample = (goal: string) => {
    setMissionGoal(goal);
    setIsModalOpen(true);
  };

  if (!workspaceId || isLoadingMissions) return <BaseLoader />;

  return (
    <Container size="xl" py="xl">
      <MissionListHeader
        workspaceId={workspaceId as string}
        onNewMission={() => setIsModalOpen(true)}
        isExplainerOpen={isExplainerOpen}
        onToggleExplainer={() => setIsExplainerOpen(!isExplainerOpen)}
      />

      <MissionExplainer
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        onSelectExample={handleSelectExample}
      />

      <CreateMissionModal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        missionGoal={missionGoal}
        setMissionGoal={setMissionGoal}
        onStartMission={handleStartMission}
        isCreating={isCreating}
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {missions?.map((mission: Mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            workspaceId={workspaceId as string}
          />
        ))}
        {(!missions || missions.length === 0) && <MissionEmptyState />}
      </SimpleGrid>
    </Container>
  );
};

export default MissionsContainer;
