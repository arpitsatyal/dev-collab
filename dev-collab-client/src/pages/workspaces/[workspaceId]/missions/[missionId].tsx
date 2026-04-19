import { Container, Title, Text, Box, Group, Button, Grid, Stack, Paper, ScrollArea, Stepper, Badge, Divider, Alert, Breadcrumbs, Anchor } from "@mantine/core";
import { IconTarget, IconTerminal2, IconChevronRight, IconAlertCircle } from "@tabler/icons-react";
import Layout from "../../../../components/Layout/Layout";
import { withAuth } from "../../../../guards/withAuth";
import { useRouter } from "next/router";
import { useGetMissionQuery, MissionStep } from "../../../../store/api/missionApi";
import { useEffect, useState, useRef } from "react";
import BaseLoader from "../../../../components/shared/base/BaseLoader";
import Link from "next/link";
import styles from "../../../missions/Missions.module.css";

const MissionHUD = () => {
    const router = useRouter();
    const { workspaceId, missionId } = router.query;
    const { data: mission, isLoading, isError } = useGetMissionQuery(missionId as string, {
      skip: !missionId,
    });

    const [logs, setLogs] = useState<{message: string, type: string, timestamp: number}[]>([]);
    const viewport = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!missionId || !mission) return;
        
        setLogs(prev => {
            if (prev.length > 0) return prev;

            const history: {message: string, type: string, timestamp: number}[] = [];
            
            if (mission.logs) {
                mission.logs.split('\n').filter(Boolean).forEach(line => {
                    history.push({ message: line, type: 'log', timestamp: new Date(mission.createdAt).getTime() });
                });
            }

            mission.steps?.forEach(step => {
                if (step.logs) {
                    step.logs.split('\n').filter(Boolean).forEach(line => {
                        history.push({ message: `[${step.label}] ${line}`, type: 'log', timestamp: new Date(step.createdAt || mission.createdAt).getTime() });
                    });
                }
            });

            return history.sort((a, b) => a.timestamp - b.timestamp);
        });
    }, [missionId, !!mission]);

    useEffect(() => {
        if (!missionId) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';
        const endpoint = `${apiUrl}/api/missions/stream/${missionId}`;

        const eventSource = new EventSource(endpoint, {
            withCredentials: true
        });

        eventSource.onmessage = (event) => {
            const logData = JSON.parse(event.data);
            setLogs((prev) => {
                if (prev.some(l => l.message === logData.message && Math.abs(l.timestamp - Date.now()) < 5000)) {
                    return prev;
                }
                return [...prev, {
                    message: logData.message,
                    type: logData.type,
                    timestamp: Date.now()
                }];
            });
            
            if (viewport.current) {
                viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [missionId]);

    const breadcrumbs = [
        { title: 'Workspace', href: `/workspaces/${workspaceId}` },
        { title: 'Missions', href: `/workspaces/${workspaceId}/missions` },
        { title: 'HUD', href: `#` },
      ].map((item, index) => (
        <Anchor component={Link} href={item.href} key={index} size="sm">
          {item.title}
        </Anchor>
      ));

    if (isLoading) return <BaseLoader />;
    if (isError || !mission) return <Container py="xl"><Alert color="red" title="Error">Mission not found.</Alert></Container>;

    const activeStepIndex = mission.steps?.findIndex(s => s.status === 'RUNNING' || s.status === 'PENDING') ?? (mission.steps?.length ?? 0);

    return (
        <Container size="xl" py="xl">
            <Breadcrumbs mb="xl" separator={<IconChevronRight size={14} />}>
                {breadcrumbs}
            </Breadcrumbs>

            <Group justify="space-between" mb="xl">
                <Box>
                    <Group gap="xs">
                        <IconTarget size={32} color="var(--mantine-color-blue-6)" />
                        <Title order={1} fz={32} fw={800} style={{ letterSpacing: '-0.5px' }}>Mission HUD</Title>
                    </Group>
                    <Text c="dimmed" size="lg" mt="xs" fw={500}>Goal: {mission.goal}</Text>
                </Box>
                <Badge size="xl" radius="md" variant="filled" 
                       color={mission.status === 'COMPLETED' ? 'green.6' : mission.status === 'RUNNING' ? 'blue.6' : 'gray.6'}>
                    {mission.status}
                </Badge>
            </Group>

            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 5 }}>
                   <Paper shadow="sm" p="xl" radius="lg" withBorder h="100%" bg="var(--mantine-color-body)">
                        <Title order={3} mb="lg" fz={20}>Mission Plan</Title>
                        <Stepper active={activeStepIndex} orientation="vertical" size="sm">
                            {mission.steps?.map((step: MissionStep) => (
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
                                <Alert icon={<IconAlertCircle size={16} />} title="Agent Requesting Approval" color="orange" radius="md">
                                    The agent needs permission to perform a sensitive action.
                                    <Group mt="md">
                                        <Button color="orange" size="xs" radius="md">Approve Step</Button>
                                        <Button variant="subtle" color="gray" size="xs" radius="md">Reject</Button>
                                    </Group>
                                </Alert>
                            </Box>
                        )}
                   </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Stack h="100%">
                        <Paper shadow="md" radius="lg" bg="dark.8" className={styles.terminalContainer} flex={1} style={{ overflow: 'hidden' }}>
                            <Group p="md" bg="dark.6" className={styles.terminalHeader} justify="space-between">
                                <Group gap="xs">
                                    <IconTerminal2 size={18} color="var(--mantine-color-gray-4)" />
                                    <Text size="sm" fw={700} c="gray.4" style={{ letterSpacing: '0.5px' }}>AGENT TERMINAL</Text>
                                </Group>
                                <Badge variant="dot" color="green" size="sm">LIVE_STREAM</Badge>
                            </Group>
                            
                            <ScrollArea h="500px" p="md" viewportRef={viewport}>
                                <Stack gap={6}>
                                    {logs.length === 0 && (
                                        <Text c="dimmed" fz="xs" ff="monospace">Initializing agent logs stream...</Text>
                                    )}
                                    {logs.map((log, i) => (
                                        <Group key={i} gap="sm" wrap="nowrap" align="flex-start">
                                            <Text c="dimmed" fz="10px" ff="monospace" mt={2}>[{new Date(log.timestamp).toLocaleTimeString()}]</Text>
                                            <Text 
                                                fz="xs" 
                                                ff="monospace" 
                                                c={log.type === 'status_change' ? 'cyan.3' : 'gray.3'}
                                                style={{ wordBreak: 'break-all', lineHeight: 1.5 }}
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
