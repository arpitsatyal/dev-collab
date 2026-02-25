import {
    Paper,
    Text,
    Group,
    Stack,
    ActionIcon,
    Collapse,
    Center,
    Tooltip,
} from "@mantine/core";
import {
    IconChevronDown,
    IconChevronUp,
    IconSparkles,
} from "@tabler/icons-react";
import { useSuggestWorkItemsQuery } from "../../../store/api/taskApi";
import { useDisclosure } from "@mantine/hooks";
import SuggestionItem from "./SuggestionItem";
import { WorkItemSuggestion } from "../../../lib/ai/services/suggestionService";
import Loading from "../../Loader/Loader";

interface AISuggestionsProps {
    projectId: string;
    onAdopt: (suggestion: WorkItemSuggestion, index: number) => void;
    dismissedIndices: number[];
    onDismiss: (index: number) => void;
    onClearDismissed: () => void;
}

const AISuggestions = ({
    projectId,
    onAdopt,
    dismissedIndices,
    onDismiss,
    onClearDismissed
}: AISuggestionsProps) => {
    const [opened, setOpened] = useDisclosure(true);
    const { data, isLoading, isFetching, refetch } = useSuggestWorkItemsQuery(projectId);

    const suggestions = data?.suggestions || [];
    const visibleSuggestions = suggestions.filter((_, i) => !dismissedIndices.includes(i));

    if (isLoading) {
        return (
            <Paper withBorder p="md" radius="md" mb="xl">
                <Stack align="center" gap="sm" py="xl">
                    <Loading loaderHeight="20vh" />
                    <Text size="sm" c="dimmed">AI is analyzing your workspace context...</Text>
                </Stack>
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
                    {isFetching && <Loading />}
                </Group>
                <Group gap="xs">
                    <ActionIcon variant="subtle" onClick={() => { onClearDismissed(); refetch(); }}>
                        <Tooltip label="Refresh Suggestions" withArrow position="right">
                            <IconSparkles size={16} />
                        </Tooltip>
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
                                handleDismiss={(i) => onDismiss(i)}
                            />
                        );
                    })}
                </Stack>
            </Collapse>
        </Paper>
    );
};

export default AISuggestions;
