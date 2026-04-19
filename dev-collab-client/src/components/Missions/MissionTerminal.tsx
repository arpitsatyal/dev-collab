import { Paper, Group, Badge, Text, ScrollArea, Stack } from "@mantine/core";
import { IconTerminal2 } from "@tabler/icons-react";
import styles from "./MissionTerminal.module.css";
import { RefObject } from "react";

interface LogEntry {
  message: string;
  type: string;
  timestamp: number;
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
        <Badge variant="dot" color="green" size="sm">LIVE_STREAM</Badge>
      </Group>

      <ScrollArea h="500px" p="md" viewportRef={viewportRef}>
        <Stack gap={6}>
          {logs.length === 0 && (
            <Text c="dimmed" fz="xs" ff="monospace">Initializing agent logs stream...</Text>
          )}
          {logs.map((log, i) => (
            <Group key={i} gap="sm" wrap="nowrap" align="flex-start">
              <Text c="dimmed" fz="10px" ff="monospace" mt={2}>
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
              </Text>
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
  );
};

export default MissionTerminal;
