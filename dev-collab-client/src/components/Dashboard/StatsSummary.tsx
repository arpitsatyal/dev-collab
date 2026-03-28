
import {
    SimpleGrid,
    Paper,
    Text,
    Group,
    ThemeIcon,
    rem,
    Stack,
    Center,
} from "@mantine/core";
import {
    IconActivity,
    IconCode,
    IconBrandPagekit,
    IconSubtask,
} from "@tabler/icons-react";
import { useGetUserStatsQuery } from "../../store/api/userApi";
import classes from "./StatsSummary.module.css";
import Loading from "../Loader/Loader";

const StatsSummary = () => {
    const { data: stats, isLoading } = useGetUserStatsQuery();

    if (isLoading) {
        return (
            <Center py="xl">
                <Loading />
            </Center>
        );
    }

    if (!stats) return null;

    const data = [
        {
            title: "Workspaces",
            value: stats.workspaces,
            icon: IconActivity,
            color: "blue",
        },
        {
            title: "Snippets",
            value: stats.snippets,
            icon: IconCode,
            color: "cyan",
        },
        {
            title: "Docs",
            value: stats.docs,
            icon: IconBrandPagekit,
            color: "violet",
        },
        {
            title: "Work Items",
            value: stats.workItems,
            icon: IconSubtask,
            color: "teal",
        },
    ];

    const statsCards = data.map((stat) => (
        <Paper withBorder p="md" radius="md" key={stat.title} className={classes.card}>
            <Group justify="space-between">
                <Stack gap={0}>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        {stat.title}
                    </Text>
                    <Text fw={700} size="xl">
                        {stat.value}
                    </Text>
                </Stack>
                <ThemeIcon
                    color="gray"
                    variant="light"
                    radius="md"
                    size={52}
                    style={{ color: `var(--mantine-color-${stat.color}-filled)` }}
                >
                    <stat.icon style={{ width: rem(32), height: rem(32) }} stroke={1.5} />
                </ThemeIcon>
            </Group>
        </Paper>
    ));

    return (
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md" mt="xl">
            {statsCards}
        </SimpleGrid>
    );
};

export default StatsSummary;
