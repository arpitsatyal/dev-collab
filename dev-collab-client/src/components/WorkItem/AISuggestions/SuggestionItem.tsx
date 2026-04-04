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
import { WorkItemSuggestion } from "../../../types";
import { getColorForString } from "../../../utils/theme/colors";

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
                        <Badge variant="filled" size="xs" color={suggestion.priority === "HIGH" ? "red" : suggestion.priority === "MEDIUM" ? "orange" : "blue"}>
                            {suggestion.priority}
                        </Badge>
                        <Badge size="xs" variant="light" color={getColorForString(suggestion.category || "")}>{suggestion.category}</Badge>
                        <Badge size="xs" variant="dot" color={suggestion.suggestedStatus === "DONE" ? "green" : suggestion.suggestedStatus === "IN_PROGRESS" ? "blue" : "gray"}>
                            {suggestion.suggestedStatus}
                        </Badge>
                    </Group>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Text
                            size="xs"
                            c="dimmed"
                            lineClamp={2}
                            mb={6}
                        >
                            {suggestion.description}
                        </Text>
                        <Group gap={6}>
                            {suggestion.tags?.map((tag) => (
                                <Badge key={tag} size="xs" variant="outline" color={getColorForString(tag)} radius="sm">
                                    {tag}
                                </Badge>
                            ))}
                        </Group>
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
