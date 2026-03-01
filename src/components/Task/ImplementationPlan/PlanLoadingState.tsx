
import React from 'react';
import { Stack, Loader, Text } from '@mantine/core';

interface PlanLoadingStateProps {
    message: string;
    fsItalic?: boolean;
}

const PlanLoadingState = ({ message, fsItalic }: PlanLoadingStateProps) => {
    return (
        <Stack align="center" py="xl">
            <Loader size="md" variant="dots" color="blue" />
            <Text size="sm" c="dimmed" fs={fsItalic ? "italic" : undefined}>
                {message}
            </Text>
        </Stack>
    );
};

export default PlanLoadingState;
