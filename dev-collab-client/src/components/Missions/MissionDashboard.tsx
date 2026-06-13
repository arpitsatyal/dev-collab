import { Container, Grid, Stack, Modal, Textarea, Button, Stack as MantineStack } from "@mantine/core";
import MissionHeader from "./MissionHeader";
import MissionPlan from "./MissionPlan";
import MissionTerminal from "./MissionTerminal";
import MissionApprovalCard from "./MissionApprovalCard";
import { Mission, useResumeMissionMutation } from "../../store/api/missionApi";
import { LogEntry } from "../../hooks/missions/useMissionLogs";
import { RefObject, useState } from "react";

interface MissionDashboardProps {
  mission: Mission;
  workspaceId: string;
  logs: LogEntry[];
  viewportRef: RefObject<HTMLDivElement | null>;
}

const MissionDashboard = ({ mission, workspaceId, logs, viewportRef }: MissionDashboardProps) => {
  const [resumeMission, { isLoading: isResuming }] = useResumeMissionMutation();
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleApprove = async () => {
    try {
      await resumeMission({ id: mission.id, action: "APPROVE" }).unwrap();
    } catch (e) {
      // swallow; UI will update via invalidation/notifications elsewhere
    }
  };

  const handleReject = async () => {
    setRejectModalOpen(false);
    const currentFeedback = feedback;
    setFeedback("");
    try {
      await resumeMission({ id: mission.id, action: "REJECT", feedback: currentFeedback }).unwrap();
    } catch (e) {
      // swallow
    }
  };

  return (
    <Container size="xl" py="xl">
      <MissionHeader mission={mission} workspaceId={workspaceId} />

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack h="100%">
            <MissionPlan steps={mission.steps || []} />
            <MissionApprovalCard 
              isVisible={mission.status === 'WAITING_FOR_USER'} 
              message={logs.filter(l => l.type === 'status_change' || l.type === 'log').pop()?.message}
              onApprove={handleApprove}
              onReject={() => setRejectModalOpen(true)}
              isLoading={isResuming}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <MissionTerminal logs={logs} viewportRef={viewportRef} />
        </Grid.Col>
      </Grid>

      <Modal
        opened={isRejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Mission"
        centered
        radius="md"
      >
        <MantineStack>
          <Textarea
            placeholder="Tell the agent what to change..."
            label="Feedback"
            minRows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.currentTarget.value)}
            radius="md"
          />
          <Button color="red" radius="md" onClick={handleReject} disabled={!feedback.trim() || isResuming} loading={isResuming}>
            Reject
          </Button>
        </MantineStack>
      </Modal>
    </Container>
  );
};

export default MissionDashboard;
