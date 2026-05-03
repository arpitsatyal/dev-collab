import { Injectable, Logger } from '@nestjs/common';
import { MissionStatus } from 'src/common/drizzle/schema/enums';
import { Subject } from 'rxjs';
import { AddStepRequest, CreateMissionRequest, MissionLog, PushLogRequest, UpdateStepStatusRequest } from '../interfaces/mission.interfaces';
import { MissionRepository } from '../repositories/mission.repository';
import { MissionStepRepository } from '../repositories/mission-step.repository';
import { MissionLogRepository } from '../repositories/mission-log.repository';

@Injectable()
export class MissionService {
  private readonly logger = new Logger(MissionService.name);
  private readonly logSubject = new Subject<MissionLog>();

  constructor(
    private readonly missionRepo: MissionRepository,
    private readonly stepRepo: MissionStepRepository,
    private readonly logRepo: MissionLogRepository,
  ) { }

  getLogObservable() {
    return this.logSubject.asObservable();
  }

  async createMission(request: CreateMissionRequest) {
    return await this.missionRepo.create({
      ...request,
      status: 'PENDING',
    });
  }

  async getMission(id: string) {
    return await this.missionRepo.findById(id);
  }

  async getWorkspaceMissions(workspaceId: string) {
    return await this.missionRepo.findByWorkspaceId(workspaceId);
  }

  async getMissionLogs(missionId: string) {
    return await this.logRepo.findByMissionId(missionId);
  }

  async addStep(request: AddStepRequest) {
    const { status = 'PENDING', ...data } = request;

    const step = await this.stepRepo.create({
      ...data,
      status,
    });

    await this.pushLog({
      missionId: step.missionId,
      message: `New step added: ${step.label}`,
      stepId: step.id,
      type: 'step_created',
      payload: step,
    });

    return step;
  }

  async updateMissionStatus(id: string, status: MissionStatus) {
    const updated = await this.missionRepo.update(id, {
      status,
      updatedAt: new Date(),
    });
    await this.pushLog({
      missionId: id,
      message: `Mission status changed to ${status}`,
      type: 'status_change',
      payload: { status },
    });
    return updated;
  }

  async updateStepStatus(request: UpdateStepStatusRequest) {
    const { id, missionId, status } = request;
    const updated = await this.stepRepo.update(id, { status });
    await this.pushLog({
      missionId,
      message: `Step status changed to ${status}`,
      stepId: id,
      type: 'step_updated',
      payload: updated,
    });
    return updated;
  }

  async pushLog(request: PushLogRequest) {
    const { missionId, message, stepId, type = 'log', payload } = request;

    try {
      const [log] = await this.logRepo.createLog({
        missionId,
        message,
        stepId,
        type,
        payload,
      });

      // Emit to real-time stream
      this.logSubject.next(log as MissionLog);
    } catch (error) {
      this.logger.error(
        `Failed to persist log for mission ${missionId}: ${error.message}`,
      );
    }
  }


}
