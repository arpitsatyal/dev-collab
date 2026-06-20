import { Paper, Group, Badge, Text, ScrollArea, Stack, Box } from "@mantine/core";
import { IconTerminal2 } from "@tabler/icons-react";
import styles from "./MissionTerminal.module.css";
import { RefObject } from "react";

interface LogEntry {
  message: string;
  type: string;
  timestamp: number;
  payload?: any;
}

interface MissionTerminalProps {
  logs: LogEntry[];
  viewportRef: RefObject<HTMLDivElement | null>;
}

const MissionTerminal = ({ logs, viewportRef }: MissionTerminalProps) => {
  return (
    <Paper shadow="md" radius="lg" bg="dark.8" className={styles.terminalContainer} flex={1}>
      <Group p="md" bg="dark.6" className={styles.terminalHeader} justify="space-between">
        <Group gap="xs">
          <IconTerminal2 size={18} color="var(--mantine-color-gray-4)" />
          <Text size="sm" fw={700} c="gray.4" style={{ letterSpacing: '0.5px' }}>AGENT TERMINAL</Text>
        </Group>
        <Badge variant="dot" color="green" size="sm" className={styles.liveBadge}>LIVE</Badge>
      </Group>

      <ScrollArea h="500px" p="md" viewportRef={viewportRef}>
        <Stack gap={6}>
          {logs.length === 0 && (
            <Text c="dimmed" fz="xs" ff="monospace">Initializing agent logs stream...</Text>
          )}
          {logs.map((log, i) => (
            <Stack key={i} gap={2}>
              <Group gap="sm" wrap="nowrap" align="flex-start">
                <Text c="dimmed" fz="10px" ff="monospace" mt={2} style={{ opacity: 0.5 }}>
                  [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                </Text>
                <Text
                  fz="xs"
                  ff="monospace"
                  c={log.type === 'status_change' ? 'cyan.3' : 'gray.3'}
                  fw={log.type === 'status_change' ? 600 : 400}
                  style={{ wordBreak: 'break-all', lineHeight: 1.5 }}
                >
                  {log.message}
                </Text>
              </Group>
              {log.payload && (
                <Box ml={65} mb={4}>
                  <Text fz="10px" ff="monospace" c="dimmed" component="pre"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      margin: 0,
                      whiteSpace: 'pre-wrap'
                    }}>
                    {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload, null, 2)}
                  </Text>
                </Box>
              )}
            </Stack>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );
};

export default MissionTerminal;
