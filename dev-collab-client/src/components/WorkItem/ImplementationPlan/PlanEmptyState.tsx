import BaseButton from "../../shared/base/BaseButton";

import React from 'react';
import { Paper, Stack, Text } from '@mantine/core';
import { IconSparkles, IconRobot } from '@tabler/icons-react';

interface PlanEmptyStateProps {
    onGenerate: () => void;
}

const PlanEmptyState = ({ onGenerate }: PlanEmptyStateProps) => {
    return (
        <Paper withBorder p="xl" radius="md" ta="center">
            <Stack align="center" gap="md">
                <IconSparkles size={48} color="var(--mantine-color-blue-filled)" opacity={0.5} />
                <Text>Need a technical guide to solve this work item?</Text>
                <BaseButton leftSection={<IconRobot size={16} />} onClick={onGenerate}>
                    Generate Execution Plan
                </BaseButton>
            </Stack>
        </Paper>
    );
};

export default PlanEmptyState;
