import { useState, useEffect, useRef } from "react";
import { useAppDispatch } from "../../store/hooks";
import { Mission, missionApi, MissionStep } from "../../store/api/missionApi";

export interface LogEntry {
  id: string;
  message: string;
  type: string;
  timestamp: number;
  payload?: any;
}

export const useMissionLogs = (missionId: string | undefined, mission: Mission | undefined) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  // Initialize logs from DB
  useEffect(() => {
    if (!missionId || !mission) return;

    setLogs(prev => {
      if (prev.length > 0) return prev;

      if (mission.missionLogs && mission.missionLogs.length > 0) {
        return mission.missionLogs.map(ml => ({
          id: ml.id,
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

      // 1. Update Logs state
      setLogs((prev) => {
        const isDuplicate = prev.some(l => l.id === logData.id);
        if (isDuplicate || !logData.id) return prev;

        return [...prev, {
          id: logData.id,
          message: logData.message,
          type: logData.type,
          timestamp: new Date(logData.sequence || Date.now()).getTime(),
          payload: logData.payload
        }];
      });

      // 2. Update Mission Cache (Steps & Status)
      dispatch(
        missionApi.util.updateQueryData('getMission', missionId, (draft) => {
          switch (logData.type) {
            case 'step_created':
              if (!logData.payload) break;
              if (!draft.steps) draft.steps = [];
              if (!draft.steps.some((s) => s.id === logData.payload.id)) {
                draft.steps.push(logData.payload as MissionStep);
              }
              break;

            case 'step_updated':
              if (!logData.payload) break;
              const stepIndex = draft.steps?.findIndex((s) => s.id === logData.payload.id);
              if (stepIndex !== undefined && stepIndex !== -1 && draft.steps) {
                draft.steps[stepIndex] = logData.payload as MissionStep;
              }
              break;

            case 'status_change':
              if (logData.payload?.status) {
                draft.status = logData.payload.status as Mission['status'];
              }
              break;
          }
        })
      );

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
