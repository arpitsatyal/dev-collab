import {
    Paper,
    Text,
    Group,
    Stack,
    ActionIcon,
    Badge,
    Tooltip,
} from "@mantine/core";
import {
    IconCheck,
    IconX,
} from "@tabler/icons-react";
import { WorkItemSuggestion } from "../../../lib/ai/services/suggestionService";

interface SuggestionItemProps {
    suggestion: WorkItemSuggestion;
    realIndex: number;
    onAdopt: (s: WorkItemSuggestion, i: number) => void;
    handleDismiss: (i: number) => void;
}

const SuggestionItem = ({
    suggestion,
    realIndex,
    onAdopt,
    handleDismiss
}: SuggestionItemProps) => {

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
                            lineClamp={2}
                        >
                            {suggestion.description}
                        </Text>
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

export default SuggestionItem;
