import { Container, Title, Text, Box, Group, Button, Grid, Stack, Paper, ScrollArea, Stepper, Badge, Divider, Alert } from "@mantine/core";
import { IconAlertCircleFilled, IconTarget, IconTerminal2 } from "@tabler/icons-react";
import Layout from "../../components/Layout/Layout";
import { withAuth } from "../../guards/withAuth";
import { useRouter } from "next/router";
import { useGetMissionQuery, MissionStep } from "../../store/api/missionApi";
import { useEffect, useState, useRef } from "react";
import BaseLoader from "../../components/shared/base/BaseLoader";
import styles from "./Missions.module.css";

const MissionHUD = () => {
    const router = useRouter();
    const missionId = router.query.missionId as string;
    const { data: mission, isLoading, isError } = useGetMissionQuery(missionId, {
        skip: !missionId,
    });

    const [logs, setLogs] = useState<{ message: string, type: string, timestamp: number }[]>([]);
    const viewport = useRef<HTMLDivElement>(null);

    // Initialize logs from mission data when it first loads
    useEffect(() => {
        if (!missionId || !mission) return;

        // We only want to initialize from DB if we haven't received any live logs yet
        // or if we're doing the first-time setup
        setLogs(prev => {
            if (prev.length > 0) return prev; // Already have logs (maybe from SSE)

            const history: { message: string, type: string, timestamp: number }[] = [];

            // Add root mission logs
            if (mission.logs) {
                mission.logs.split('\n').filter(Boolean).forEach(line => {
                    history.push({ message: line, type: 'log', timestamp: new Date(mission.createdAt).getTime() });
                });
            }

            // Add step logs
            mission.steps?.forEach(step => {
                if (step.logs) {
                    step.logs.split('\n').filter(Boolean).forEach(line => {
                        history.push({ message: `[${step.label}] ${line}`, type: 'log', timestamp: new Date(mission.createdAt).getTime() });
                    });
                }
            });

            return history.sort((a, b) => a.timestamp - b.timestamp);
        });
    }, [missionId, !!mission]);

    // SSE Integration
    useEffect(() => {
        if (!missionId) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';
        // Corrected URL: Added /api prefix and ensured fallback port 4000
        const endpoint = `${apiUrl}/api/missions/stream/${missionId}`;
        console.log(`Connecting to SSE: ${endpoint}`);

        const eventSource = new EventSource(endpoint, {
            withCredentials: true
        });

        eventSource.onmessage = (event) => {
            const logData = JSON.parse(event.data);
            setLogs((prev) => {
                // Prevent duplicate logs if possible (e.g. if we just hydrated from DB)
                if (prev.some(l => l.message === logData.message && Math.abs(l.timestamp - Date.now()) < 5000)) {
                    return prev;
                }
                return [...prev, {
                    message: logData.message,
                    type: logData.type,
                    timestamp: Date.now()
                }];
            });

            // Auto scroll to bottom
            if (viewport.current) {
                viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
            }
        };

        eventSource.onerror = () => {
            console.error("SSE Connection failed");
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [missionId]);

    if (isLoading) return <BaseLoader />;
    if (isError || !mission) return <Container py="xl"><Alert color="red" title="Error">Mission not found.</Alert></Container>;

    const activeStepIndex = mission.steps?.findIndex(s => s.status === 'RUNNING' || s.status === 'PENDING') ?? (mission.steps?.length ?? 0);

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <Box>
                    <Group gap="xs">
                        <IconTarget size={32} color="var(--mantine-color-blue-6)" />
                        <Title order={1} fz={32}>Mission HUD</Title>
                    </Group>
                    <Text c="dimmed" size="lg" mt="xs">Goal: {mission.goal}</Text>
                </Box>
                <Badge size="xl" radius="md" variant="filled"
                    color={mission.status === 'COMPLETED' ? 'green' : mission.status === 'RUNNING' ? 'blue' : 'gray'}>
                    {mission.status}
                </Badge>
            </Group>

            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Paper shadow="md" p="xl" radius="lg" withBorder h="100%">
                        <Title order={3} mb="lg">Mission Plan</Title>
                        <Stepper active={activeStepIndex} orientation="vertical" size="sm">
                            {mission.steps?.map((step: MissionStep, index: number) => (
                                <Stepper.Step
                                    key={step.id}
                                    label={step.label}
                                    description={step.status}
                                    state={step.status === 'COMPLETED' ? 'stepCompleted' : step.status === 'RUNNING' ? 'stepProgress' : undefined}
                                />
                            ))}
                        </Stepper>

                        {mission.status === 'PAUSED' && (
                            <Box mt="xl">
                                <Divider mb="md" label="Action Required" labelPosition="center" color="orange" />
                                <Alert icon={<IconAlertCircleFilled size={16} />} title="Agent Requesting Approval" color="orange" radius="md">
                                    The agent needs permission to perform a sensitive action.
                                    <Group mt="md">
                                        <Button color="orange" size="xs">Approve Step</Button>
                                        <Button variant="subtle" color="gray" size="xs">Reject</Button>
                                    </Group>
                                </Alert>
                            </Box>
                        )}
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Stack h="100%">
                        <Paper shadow="md" radius="lg" bg="dark.8" className={styles.terminalContainer} flex={1}>
                            <Group p="md" bg="dark.6" className={styles.terminalHeader} justify="space-between">
                                <Group gap="xs">
                                    <IconTerminal2 size={18} color="var(--mantine-color-gray-4)" />
                                    <Text size="sm" fw={600} c="gray.4">Agent Terminal</Text>
                                </Group>
                                <Badge variant="dot" color="green" size="sm">LIVE</Badge>
                            </Group>

                            <ScrollArea h="400px" p="md" viewportRef={viewport}>
                                <Stack gap={4}>
                                    {logs.length === 0 && (
                                        <Text c="dimmed" fz="xs" ff="monospace">Initializing agent logs stream...</Text>
                                    )}
                                    {logs.map((log, i) => (
                                        <Group key={i} gap="xs" wrap="nowrap" align="flex-start">
                                            <Text c="dimmed" fz="xs" ff="monospace">[{new Date(log.timestamp).toLocaleTimeString()}]</Text>
                                            <Text
                                                fz="xs"
                                                ff="monospace"
                                                c={log.type === 'status_change' ? 'cyan.4' : 'gray.3'}
                                                style={{ wordBreak: 'break-all' }}
                                            >
                                                {log.message}
                                            </Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </ScrollArea>
                        </Paper>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export const getServerSideProps = withAuth(async () => {
    return {
        props: {},
    };
});

MissionHUD.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default MissionHUD;
