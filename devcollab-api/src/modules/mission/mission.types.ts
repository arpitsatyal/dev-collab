import { MissionStepStatus } from 'src/common/drizzle/schema';

export type MissionLogType =
  | 'log'
  | 'status_change'
  | 'step_created'
  | 'step_updated';

export interface MissionLog {
  id: string;
  missionId: string;
  stepId?: string;
  type: MissionLogType;
  message: string;
  payload?: any;
  sequence: Date;
}

export interface PushLogRequest {
  missionId: string;
  message: string;
  stepId?: string;
  type?: MissionLogType;
  payload?: any;
}

export interface AddStepRequest {
  missionId: string;
  label: string;
  status?: MissionStepStatus;
  payload?: any;
}

export interface UpdateStepStatusRequest {
  id: string;
  missionId: string;
  status: MissionStepStatus;
}

export interface CreateMissionRequest {
  workspaceId: string;
  goal: string;
}
