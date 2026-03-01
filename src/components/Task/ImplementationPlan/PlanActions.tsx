
import React from 'react';
import { Group, Button, Divider } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';

interface PlanActionsProps {
    showDraftButton: boolean;
    loadingDraft: boolean;
    onGenerateDraft: () => void;
    onRegeneratePlan: () => void;
}

const PlanActions = ({
    showDraftButton,
    loadingDraft,
    onGenerateDraft,
    onRegeneratePlan
}: PlanActionsProps) => {
    return (
        <>
            <Divider mt="xl" mb="md" />
            <Group justify="right" wrap="wrap">
                {showDraftButton && (
                    <Button
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan' }}
                        leftSection={<IconSparkles size={16} />}
                        onClick={onGenerateDraft}
                        loading={loadingDraft}
                    >
                        Draft Suggested Changes
                    </Button>
                )}
                <Button
                    variant="light"
                    onClick={onRegeneratePlan}
                    disabled={loadingDraft}
                >
                    Regenerate Plan
                </Button>
            </Group>
        </>
    );
};

export default PlanActions;
