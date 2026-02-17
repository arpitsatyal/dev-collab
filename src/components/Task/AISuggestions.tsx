
import {
    Paper,
    Text,
    Group,
    Stack,
    ActionIcon,
    Badge,
    Collapse,
    Loader,
    Center,
    Tooltip,
} from "@mantine/core";
import {
    IconRobot,
    IconCheck,
    IconX,
    IconChevronDown,
    IconChevronUp,
    IconSparkles,
} from "@tabler/icons-react";
import { useState, forwardRef, useImperativeHandle } from "react";
import { useSuggestWorkItemsQuery } from "../../store/api/taskApi";
import { WorkItemSuggestion } from "../../lib/ai/services/suggestionService";
import { useDisclosure } from "@mantine/hooks";

interface AISuggestionsProps {
    projectId: string;
    onAdopt: (suggestion: WorkItemSuggestion, index: number) => void;
}

export interface AISuggestionsHandle {
    dismiss: (index: number) => void;
}

const SuggestionItem = ({
    suggestion,
    realIndex,
    onAdopt,
    handleDismiss
}: {
    suggestion: WorkItemSuggestion;
    realIndex: number;
    onAdopt: (s: WorkItemSuggestion, i: number) => void;
    handleDismiss: (i: number) => void;
}) => {
    const [expanded, { toggle }] = useDisclosure(false);

    return (
        <Paper withBorder p="sm" radius="md" shadow="xs">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={4} style={{ flex: 1 }}>
                    <Group gap="xs">
                        <Text fw={600} size="sm">{suggestion.title}</Text>
                        <Badge size="xs" color={suggestion.priority === "HIGH" ? "red" : suggestion.priority === "MEDIUM" ? "orange" : "blue"}>
                            {suggestion.priority}
                        </Badge>
                        <Badge size="xs" variant="outline">{suggestion.category}</Badge>
                    </Group>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Text
                            size="xs"
                            c="dimmed"
                            lineClamp={expanded ? undefined : 2}
                            style={{ transition: 'all 0.2s ease' }}
                        >
                            {suggestion.description}
                        </Text>
                        {suggestion.description.length > 100 && (
                            <Text
                                size="xs"
                                c="blue"
                                span
                                style={{ cursor: 'pointer', fontWeight: 500 }}
                                onClick={toggle}
                            >
                                {expanded ? "See less" : "See more"}
                            </Text>
                        )}
                    </div>
                </Stack>
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Adopt Suggestion">
                        <ActionIcon color="blue" variant="light" onClick={() => onAdopt(suggestion, realIndex)}>
                            <IconCheck size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Dismiss">
                        <ActionIcon color="gray" variant="subtle" onClick={() => handleDismiss(realIndex)}>
                            <IconX size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
        </Paper>
    );
};

const AISuggestions = forwardRef<AISuggestionsHandle, AISuggestionsProps>(
    ({ projectId, onAdopt }, ref) => {
        const [opened, setOpened] = useDisclosure(true);
        const { data, isLoading, isFetching, refetch } = useSuggestWorkItemsQuery(projectId);
        const [dismissedIndices, setDismissedIndices] = useState<number[]>([]);

        const suggestions = data?.suggestions || [];
        const visibleSuggestions = suggestions.filter((_, i) => !dismissedIndices.includes(i));

        useImperativeHandle(ref, () => ({
            dismiss: (index: number) => setDismissedIndices(prev => [...prev, index]),
        }));

        if (isLoading) {
            return (
                <Paper withBorder p="md" radius="md" mb="xl">
                    <Center py="xl">
                        <Stack align="center" gap="sm">
                            <Loader size="sm" />
                            <Text size="sm" c="dimmed">AI is analyzing your workspace context...</Text>
                        </Stack>
                    </Center>
                </Paper>
            );
        }

        if (visibleSuggestions.length === 0 && !isFetching) return null;

        return (
            <Paper withBorder p="md" radius="md" mb="xl" bg="var(--mantine-color-blue-light)">
                <Group justify="space-between" mb={opened ? "md" : 0}>
                    <Group gap="sm">
                        <IconSparkles size={20} color="var(--mantine-color-blue-filled)" />
                        <Text fw={700} size="sm">AI Agent Suggestions</Text>
                        {isFetching && <Loader size="xs" />}
                    </Group>
                    <Group gap="xs">
                        <ActionIcon variant="subtle" onClick={() => { setDismissedIndices([]); refetch(); }}>
                            <IconSparkles size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" onClick={setOpened.toggle}>
                            {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </ActionIcon>
                    </Group>
                </Group>

                <Collapse in={opened}>
                    <Stack gap="sm">
                        {visibleSuggestions.map((suggestion) => {
                            const realIndex = suggestions.indexOf(suggestion);
                            return (
                                <SuggestionItem
                                    key={realIndex}
                                    suggestion={suggestion}
                                    realIndex={realIndex}
                                    onAdopt={onAdopt}
                                    handleDismiss={(i) => setDismissedIndices(p => [...p, i])}
                                />
                            );
                        })}
                    </Stack>
                </Collapse>
            </Paper>
        );
    }
);

AISuggestions.displayName = "AISuggestions";

export default AISuggestions;
