import { MissionStepStatus } from 'src/common/drizzle/schema/enums';

export interface CreateMissionRequest {
  workspaceId: string;
  goal: string;
}

export interface PushLogRequest {
  missionId: string;
  message: string;
  stepId?: string;
  type?: string;
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

export interface MissionLog {
  id: string;
  missionId: string;
  stepId?: string;
  type: string;
  message: string;
  payload?: any;
  sequence: Date;
}
