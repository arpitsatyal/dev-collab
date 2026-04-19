import { Container, Grid, Stack } from "@mantine/core";
import MissionHeader from "./MissionHeader";
import MissionPlan from "./MissionPlan";
import MissionTerminal from "./MissionTerminal";
import MissionApprovalCard from "./MissionApprovalCard";
import { Mission } from "../../store/api/missionApi";
import { LogEntry } from "../../hooks/missions/useMissionLogs";
import { RefObject } from "react";

interface MissionDashboardProps {
  mission: Mission;
  workspaceId: string;
  logs: LogEntry[];
  viewportRef: RefObject<HTMLDivElement | null>;
}

const MissionDashboard = ({ mission, workspaceId, logs, viewportRef }: MissionDashboardProps) => {
  return (
    <Container size="xl" py="xl">
      <MissionHeader mission={mission} workspaceId={workspaceId} />

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack h="100%">
            <MissionPlan steps={mission.steps || []} />
            <MissionApprovalCard isVisible={mission.status === 'PAUSED'} />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <MissionTerminal logs={logs} viewportRef={viewportRef} />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default MissionDashboard;
