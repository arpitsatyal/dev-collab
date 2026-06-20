import BaseButton from "../../shared/base/BaseButton";

import React from "react";
import { Group, Divider, TextInput } from "@mantine/core";
import { IconSparkles, IconDeviceFloppy } from "@tabler/icons-react";

interface PlanActionsProps {
  loadingPlan?: boolean;
  onRegeneratePlan: () => void;
  suggestedFileName?: string;
  setSuggestedFileName?: (name: string) => void;
  isSaving?: boolean;
  onSaveDocument?: () => void;
  saveSuccess?: boolean;
  showSaveActions?: boolean;
}

const PlanActions = ({
  loadingPlan,
  onRegeneratePlan,
  suggestedFileName,
  setSuggestedFileName,
  isSaving,
  onSaveDocument,
  saveSuccess,
  showSaveActions,
}: PlanActionsProps) => {
  return (
    <>
      <Divider mt="xl" mb="md" />
      <Group justify="space-between" align="center" wrap="wrap">
        <Group>
          {showSaveActions && (
            <>
              <TextInput
                size="sm"
                placeholder="Filename (e.g., Plan.md)"
                value={suggestedFileName}
                onChange={(e) => setSuggestedFileName?.(e.currentTarget.value)}
                w={300}
                disabled={isSaving || saveSuccess}
              />
              <BaseButton
                variant="filled"
                color="teal"
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={onSaveDocument}
                loading={isSaving}
                disabled={saveSuccess || !suggestedFileName}
              >
                {saveSuccess ? "Saved to Docs" : "Save as Document"}
              </BaseButton>
            </>
          )}
        </Group>

        <Group justify="right">
          <BaseButton
            variant="light"
            onClick={onRegeneratePlan}
            disabled={isSaving || loadingPlan}
          >
            Regenerate Plan
          </BaseButton>
        </Group>
      </Group>
    </>
  );
};

export default PlanActions;
