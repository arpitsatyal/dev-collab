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

      if (mission.missionLogs && mission.missionLogs.length > 0) {
        return mission.missionLogs.map(ml => ({
          message: ml.stepId ? `[Step] ${ml.message}` : ml.message,
          type: ml.type,
          timestamp: new Date(ml.sequence).getTime(),
          payload: ml.payload
        }));
      }

      return [];
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
          timestamp: Date.now(),
          payload: logData.payload
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
