
import {
    Modal,
    Stack,
    Text,
    Group,
    Paper,
    Notification,
} from "@mantine/core";
import { IconRobot, IconCheck } from "@tabler/icons-react";
import React, { useState, useRef } from "react";
import MarkdownContent from "../../shared/MarkdownContent";
import PlanEmptyState from "./PlanEmptyState";
import PlanLoadingState from "./PlanLoadingState";
import PlanActions from "./PlanActions";
import { useCreateDocMutation } from "../../../store/api/docsApi";
import { useGenerateImplementationPlanMutation } from "../../../store/api/aiApi";

interface ImplementationPlanModalProps {
    opened: boolean;
    onClose: () => void;
    taskId: string;
    taskTitle: string;
    projectId: string;
    initialPlan?: string | null;
}

const ImplementationPlanModal = ({
    opened,
    onClose,
    taskId,
    taskTitle,
    projectId,
    initialPlan,
}: ImplementationPlanModalProps) => {
    const [plan, setPlan] = useState<string | null>(initialPlan || null);
    const [suggestedFileName, setSuggestedFileName] = useState<string>("Implementation_Plan.md");

    const [createDoc, { isLoading: isSaving }] = useCreateDocMutation();
    const [generatePlan, { isLoading: loading }] = useGenerateImplementationPlanMutation();

    const [saveSuccess, setSaveSuccess] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const topAnchorRef = useRef<HTMLDivElement>(null);

    const handleGeneratePlan = async () => {
        setPlan(null);
        setSaveSuccess(false);
        try {
            const data = await generatePlan({ taskId }).unwrap();
            setPlan(data.plan);
            setSuggestedFileName(`${taskTitle.replace(/[^a-z0-9]/gi, '_')}_Plan.md`);
        } catch (error) {
            console.error("Failed to generate plan", error);
        }
    };

    const handleSaveDocument = async (filename: string) => {
        if (!plan) return;
        try {
            await createDoc({
                projectId,
                doc: {
                    label: filename,
                    projectId,
                    roomId: "", // Handled by API
                    content: plan,
                }
            }).unwrap();
            setSaveSuccess(true);
            setTimeout(() => {
                topAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch (error) {
            console.error("Failed to save document:", error);
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
            <Stack gap="md" style={{ maxWidth: '100%', overflowX: 'hidden' }} ref={viewportRef}>
                <div ref={topAnchorRef} />
                {!plan && !loading && (
                    <PlanEmptyState onGenerate={handleGeneratePlan} />
                )}

                {loading && (
                    <PlanLoadingState message="AI is analyzing the linked code context..." />
                )}

                {!loading && plan && (
                    <Stack gap="md">
                        {saveSuccess && (
                            <Notification icon={<IconCheck size={18} />} color="teal" title="Document Saved" onClose={() => setSaveSuccess(false)}>
                                Successfully saved "{suggestedFileName}" to project documents.
                            </Notification>
                        )}
                        <Paper
                            withBorder
                            p="md"
                            radius="md"
                            bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
                        >
                            <MarkdownContent content={plan} />
                        </Paper>
                    </Stack>
                )}

                {(plan || loading) && (
                    <PlanActions
                        loadingPlan={loading}
                        onRegeneratePlan={handleGeneratePlan}
                        suggestedFileName={suggestedFileName}
                        setSuggestedFileName={setSuggestedFileName}
                        isSaving={isSaving}
                        onSaveDocument={plan ? () => handleSaveDocument(suggestedFileName) : undefined}
                        saveSuccess={saveSuccess}
                    />
                )}
            </Stack>
        </Modal>
    );
};

export default ImplementationPlanModal;
