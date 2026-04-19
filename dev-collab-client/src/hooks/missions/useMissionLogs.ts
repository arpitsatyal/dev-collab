import { useState, useEffect, useRef } from "react";
import { Mission } from "../../store/api/missionApi";

export interface LogEntry {
  message: string;
  type: string;
  timestamp: number;
}

export const useMissionLogs = (missionId: string | undefined, mission: Mission | undefined) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Initialize logs from DB
  useEffect(() => {
    if (!missionId || !mission) return;

    setLogs(prev => {
      if (prev.length > 0) return prev;

      const history: LogEntry[] = [];

      if (mission.logs) {
        mission.logs.split('\n').filter(Boolean).forEach(line => {
          history.push({ message: line, type: 'log', timestamp: new Date(mission.createdAt).getTime() });
        });
      }

      mission.steps?.forEach(step => {
        if (step.logs) {
          step.logs.split('\n').filter(Boolean).forEach(line => {
            history.push({ 
              message: `[${step.label}] ${line}`, 
              type: 'log', 
              timestamp: new Date(mission.createdAt).getTime() 
            });
          });
        }
      });

      return history.sort((a, b) => a.timestamp - b.timestamp);
    });
  }, [missionId, mission]);

  // SSE Integration
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
        const isDuplicate = prev.some(l => l.message === logData.message && Math.abs(l.timestamp - Date.now()) < 5000);
        if (isDuplicate) return prev;

        return [...prev, {
          message: logData.message,
          type: logData.type,
          timestamp: Date.now()
        }];
      });

      if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [missionId]);

  return { logs, viewportRef };
};
