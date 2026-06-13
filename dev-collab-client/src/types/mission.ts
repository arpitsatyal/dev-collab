export interface Mission {
  id: string;
  goal: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'WAITING_FOR_USER' | 'COMPLETED' | 'FAILED';
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  steps?: MissionStep[];
  missionLogs?: MissionLog[];
}

export interface MissionLog {
  id: string;
  missionId: string;
  stepId?: string;
  type: string;
  message: string;
  payload?: any;
  sequence: string;
  createdAt: string;
}

export interface MissionStep {
  id: string;
  missionId: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}
