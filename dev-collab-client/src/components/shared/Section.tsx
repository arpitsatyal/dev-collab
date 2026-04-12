import { Box, Stack, Title, Text, Group } from "@mantine/core";
import { ReactNode } from "react";

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  rightSection?: ReactNode;
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
}

const Section = ({
  title,
  description,
  children,
  rightSection,
  spacing = "md",
}: SectionProps) => {
  return (
    <Box component="section" mb="xl">
      <Stack gap={spacing}>
        {(title || rightSection) && (
          <Group justify="space-between" align="flex-end">
            <Stack gap={4}>
              {title && (
                <Title order={2} size="h3">
                  {title}
                </Title>
              )}
              {description && (
                <Text size="sm" c="dimmed">
                  {description}
                </Text>
              )}
            </Stack>
            {rightSection && <Box>{rightSection}</Box>}
          </Group>
        )}
        <Box>{children}</Box>
      </Stack>
    </Box>
  );
};

export default Section;
