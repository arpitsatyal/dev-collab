
import {
    Modal,
    Button,
    Stack,
    Text,
    Group,
    Paper,
} from "@mantine/core";
import { IconRobot } from "@tabler/icons-react";
import React, { useState } from "react";
import MarkdownContent from "./MarkdownContent";
import PlanEmptyState from "./PlanEmptyState";
import PlanLoadingState from "./PlanLoadingState";
import PlanActions from "./PlanActions";

interface ImplementationPlanModalProps {
    opened: boolean;
    onClose: () => void;
    taskId: string;
    taskTitle: string;
}

const ImplementationPlanModal = ({
    opened,
    onClose,
    taskId,
    taskTitle,
}: ImplementationPlanModalProps) => {
    const [plan, setPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [draft, setDraft] = useState<string | null>(null);
    const [loadingDraft, setLoadingDraft] = useState(false);

    const handleGeneratePlan = async () => {
        setLoading(true);
        setDraft(null);
        try {
            const response = await fetch(`/api/ai/analyze-work-item?taskId=${taskId}`);
            const data = await response.json();
            setPlan(data.plan);
        } catch (error) {
            console.error("Failed to generate plan", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDraft = async () => {
        setLoadingDraft(true);
        try {
            const response = await fetch(`/api/ai/draft-changes?taskId=${taskId}`);
            const data = await response.json();
            setDraft(data.draft);
        } catch (error) {
            console.error("Failed to generate draft", error);
        } finally {
            setLoadingDraft(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconRobot size={20} color="var(--mantine-color-blue-filled)" />
                    <Text fw={700}>AI Implementation Plan: {taskTitle}</Text>
                </Group>
            }
            size="xl"
            styles={{
                body: { overflowX: 'hidden', width: '100%' },
                content: { overflowX: 'hidden' }
            }}
        >
            <Stack gap="md" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                {!plan && !loading && (
                    <PlanEmptyState onGenerate={handleGeneratePlan} />
                )}

                {loading && (
                    <PlanLoadingState message="AI is analyzing the linked code context..." />
                )}

                {plan && (
                    <>
                        {loadingDraft ? (
                            <PlanLoadingState message="AI is drafting your code changes..." fsItalic />
                        ) : draft ? (
                            <Stack gap="md">
                                <Group justify="space-between" align="center">
                                    <Text fw={700} size="lg" c="blue">Draft Implementation</Text>
                                    <Group gap="xs">
                                        <Button variant="subtle" size="xs" onClick={() => setDraft(null)}>Back to Plan</Button>
                                    </Group>
                                </Group>
                                <Paper
                                    withBorder
                                    p="sm"
                                    radius="md"
                                    bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
                                >
                                    <MarkdownContent content={draft} />
                                </Paper>
                            </Stack>
                        ) : (
                            <MarkdownContent content={plan} />
                        )}

                        <PlanActions
                            showDraftButton={!draft && !loadingDraft}
                            loadingDraft={loadingDraft}
                            onGenerateDraft={handleGenerateDraft}
                            onRegeneratePlan={() => { setPlan(null); setDraft(null); }}
                        />
                    </>
                )}
            </Stack>
        </Modal>
    );
};

export default ImplementationPlanModal;
