
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
import { useState } from "react";
import ReactMarkdown from "react-markdown";

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

    const handleGeneratePlan = async () => {
        setLoading(true);
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
                        <Loader size="lg" />
                        <Text size="sm" c="dimmed">AI is analyzing the linked code context...</Text>
                    </Stack>
                )}

                {plan && (
                    <div className="markdown-body">
                        <ReactMarkdown>{plan}</ReactMarkdown>
                        <Divider mt="xl" mb="md" />
                        <Group justify="right">
                            <Button variant="light" onClick={() => setPlan(null)}>
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
