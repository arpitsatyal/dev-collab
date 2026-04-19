import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { MissionRepository, MissionStepRepository } from './repositories/mission.repository';
import { MissionStatus, MissionStepStatus } from 'src/common/drizzle/schema';
import { Subject } from 'rxjs';
import { AgentPort } from '../ai/ports/agent.port';
import { HumanMessage } from '@langchain/core/messages';

export interface MissionLog {
  missionId: string;
  stepId?: string;
  type: 'log' | 'status_change';
  message: string;
  payload?: any;
}

@Injectable()
export class MissionService {
  private readonly logger = new Logger(MissionService.name);
  private readonly logSubject = new Subject<MissionLog>();

  constructor(
    private readonly missionRepo: MissionRepository,
    private readonly stepRepo: MissionStepRepository,
    @Inject(forwardRef(() => AgentPort))
    private readonly agentPort: AgentPort,
  ) { }

  getLogObservable() {
    return this.logSubject.asObservable();
  }

  async createMission(workspaceId: string, goal: string) {
    const mission = await this.missionRepo.create({
      workspaceId,
      goal,
      status: 'PENDING',
    });
    return mission;
  }

  async getMission(id: string) {
    return this.missionRepo.findById(id);
  }

  async getWorkspaceMissions(workspaceId: string) {
    return this.missionRepo.findByWorkspaceId(workspaceId);
  }

  async addStep(missionId: string, label: string, status: MissionStepStatus = 'PENDING') {
    const step = await this.stepRepo.create({
      missionId,
      label,
      status,
    });

    this.logSubject.next({
      missionId,
      stepId: step.id,
      type: 'status_change',
      message: `Step added: ${label} (${status})`,
    });

    return step;
  }

  async updateMissionStatus(id: string, status: MissionStatus) {
    const updated = await this.missionRepo.update(id, { status, updatedAt: new Date() });

    this.logSubject.next({
      missionId: id,
      type: 'status_change',
      message: `Mission status changed to ${status}`,
    });

    return updated;
  }

  async updateStepStatus(id: string, missionId: string, status: MissionStepStatus, logs?: string) {
    const updated = await this.stepRepo.update(id, { status, logs });

    this.logSubject.next({
      missionId,
      stepId: id,
      type: 'status_change',
      message: `Step status changed to ${status}`,
      payload: { logs },
    });

    return updated;
  }

  async pushLog(missionId: string, message: string, stepId?: string) {
    this.logSubject.next({
      missionId,
      stepId,
      type: 'log',
      message,
    });

    try {
      if (stepId && stepId.length > 20) { // Basic check for UUID vs random strings
        await this.stepRepo.appendLog(stepId, message);
      } else {
        await this.missionRepo.appendLog(missionId, message);
      }
    } catch (error) {
      this.logger.error(`Failed to persist log for mission ${missionId}: ${error.message}`);
    }
  }

  async runMission(id: string) {
    const mission = await this.getMission(id);
    if (!mission) throw new Error('Mission not found');

    await this.updateMissionStatus(id, 'RUNNING');

    //maybe we have a better way.
    // Run the agent in the background
    (async () => {
      try {
        await this.pushLog(id, `Launching autonomous agent for goal: ${mission.goal}`);

        const result = await this.agentPort.runAgentGraph(
          [new HumanMessage(mission.goal)],
          mission.workspaceId,
          id,
        );

        await this.addStep(id, 'Finalizing Mission');
        await this.updateMissionStatus(id, 'COMPLETED');
        await this.pushLog(id, 'Mission completed successfully!');
        this.logger.log(`Mission ${id} finished. Result: ${result.answer.slice(0, 100)}...`);
      } catch (error) {
        this.logger.error(`Mission ${id} failed:`, error);
        await this.updateMissionStatus(id, 'FAILED');
        await this.pushLog(id, `Mission failed: ${error.message}`);
      }
    })();
  }
}
