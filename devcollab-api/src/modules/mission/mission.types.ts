import { MissionStepStatus } from 'src/common/drizzle/schema';

export interface MissionLog {
  missionId: string;
  stepId?: string;
  type: 'log' | 'status_change';
  message: string;
  payload?: any;
}

export interface PushLogOptions {
  missionId: string;
  message: string;
  stepId?: string;
  type?: 'log' | 'status_change';
  payload?: any;
}

export interface AddStepOptions {
  missionId: string;
  label: string;
  status?: MissionStepStatus;
  payload?: any;
}

export interface UpdateStepStatusOptions {
  id: string;
  missionId: string;
  status: MissionStepStatus;
}

export interface CreateMissionOptions {
  workspaceId: string;
  goal: string;
}
