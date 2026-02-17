
import {
    Modal,
    Button,
    Stack,
    Text,
    Group,
    Loader,
    ScrollArea,
    Divider,
    Paper,
} from "@mantine/core";
import { IconRobot, IconSparkles } from "@tabler/icons-react";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import Loading from "../Loader/Loader";

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
            scrollAreaComponent={ScrollArea.Autosize}
        >
            <Stack gap="md">
                {!plan && !loading && (
                    <Paper withBorder p="xl" radius="md" ta="center">
                        <Stack align="center" gap="md">
                            <IconSparkles size={48} color="var(--mantine-color-blue-filled)" opacity={0.5} />
                            <Text>Need a technical guide to solve this work item?</Text>
                            <Button leftSection={<IconRobot size={16} />} onClick={handleGeneratePlan}>
                                Generate Execution Plan
                            </Button>
                        </Stack>
                    </Paper>
                )}

                {loading && (
                    <Stack align="center" py="xl">
                        <Loading />
                        <Text size="sm" c="dimmed">AI is analyzing the linked code context...</Text>
                    </Stack>
                )}

                {plan && (
                    <div className="markdown-body">
                        {loadingDraft ? (
                            <Stack align="center" py="xl">
                                <Loader size="md" variant="dots" color="blue" />
                                <Text size="sm" c="dimmed" fs="italic">AI is drafting your code changes...</Text>
                            </Stack>
                        ) : draft ? (
                            <Stack gap="md">
                                <Group justify="space-between" align="center">
                                    <Text fw={700} size="lg" c="blue">Draft Implementation</Text>
                                    <Button variant="subtle" size="xs" onClick={() => setDraft(null)}>Back to Plan</Button>
                                </Group>
                                <Paper
                                    withBorder
                                    p="sm"
                                    radius="md"
                                    bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
                                >
                                    <ReactMarkdown>{draft}</ReactMarkdown>
                                </Paper>
                            </Stack>
                        ) : (
                            <ReactMarkdown>{plan}</ReactMarkdown>
                        )}

                        <Divider mt="xl" mb="md" />
                        <Group justify="right">
                            {!draft && !loadingDraft && (
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'blue', to: 'cyan' }}
                                    leftSection={<IconSparkles size={16} />}
                                    onClick={handleGenerateDraft}
                                >
                                    Draft Suggested Changes
                                </Button>
                            )}
                            <Button variant="light" onClick={() => { setPlan(null); setDraft(null); }}>
                                Regenerate Plan
                            </Button>
                        </Group>
                    </div>
                )}
            </Stack>
        </Modal>
    );
};

export default ImplementationPlanModal;
