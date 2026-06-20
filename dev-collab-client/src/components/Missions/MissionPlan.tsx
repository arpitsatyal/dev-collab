import { Paper, Title, Stepper } from "@mantine/core";
import { IconCircleX } from "@tabler/icons-react";
import { MissionStep } from "../../store/api/missionApi";

interface MissionPlanProps {
  steps: MissionStep[];
}

const MissionPlan = ({ steps }: MissionPlanProps) => {
  const activeStepIndex = steps.findIndex(s => s.status === 'RUNNING' || s.status === 'PENDING');
  const finalizedIndex = activeStepIndex === -1 ? steps.length : activeStepIndex;

  return (
    <Paper shadow="sm" p="xl" radius="lg" withBorder h="100%" bg="var(--mantine-color-body)">
      <Title order={3} mb="lg" fz={20}>Mission Plan</Title>
      <Stepper active={finalizedIndex} orientation="vertical" size="sm">
        {steps.map((step) => (
          <Stepper.Step 
            key={step.id}
            label={step.label}
            description={step.status}
            color={step.status === 'FAILED' ? 'red' : undefined}
            icon={step.status === 'FAILED' ? <IconCircleX size={18} /> : undefined}
            state={
                step.status === 'COMPLETED' ? 'stepCompleted' : 
                step.status === 'RUNNING' ? 'stepProgress' : undefined
            }
          />
        ))}
      </Stepper>
    </Paper>
  );
};

export default MissionPlan;
