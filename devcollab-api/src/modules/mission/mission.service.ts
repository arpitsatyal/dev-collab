import { Injectable, Logger } from '@nestjs/common';
import { MissionRepository, MissionStepRepository } from './repositories/mission.repository';
import { MissionLogRepository } from './repositories/mission-log.repository';
import { MissionStatus, MissionStepStatus } from 'src/common/drizzle/schema';
import { Subject } from 'rxjs';
import { AgentPort } from '../ai/ports/agent.port';
import { HumanMessage } from '@langchain/core/messages';
import { OnEvent } from '@nestjs/event-emitter';
import { AgentEvents, AgentActionEvent } from '../ai/agent/agent.events';

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
    private readonly logRepo: MissionLogRepository,
    private readonly agentPort: AgentPort,
  ) { }

  @OnEvent(AgentEvents.ACTION)
  async handleAgentAction(event: AgentActionEvent) {
    const { missionId, type, label, payload, callId } = event;

    switch (type) {
      case 'REASONING_START':
        await this.pushLog(missionId, label);
        break;
      case 'TOOL_START': {
        const step = await this.addStep(missionId, label, 'RUNNING', { callId });
        await this.pushLog(
          missionId,
          `Agent executing ${payload?.tool || 'tool'}`,
          step.id,
        );
        break;
      }
      case 'TOOL_END': {
        const mission = await this.getMission(missionId);
        const runningStep = mission?.steps?.find(
          (s) => (s.payload as any)?.callId === callId,
        );
        if (runningStep) {
          await this.updateStepStatus(runningStep.id, missionId, 'COMPLETED');
        }
        break;
      }
    }
  }

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

  async addStep(
    missionId: string,
    label: string,
    status: MissionStepStatus = 'PENDING',
    payload?: any,
  ) {
    const step = await this.stepRepo.create({
      missionId,
      label,
      status,
      payload,
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

    await this.pushLog(id, `Mission status changed to ${status}`, undefined, 'status_change');

    return updated;
  }

  async updateStepStatus(id: string, missionId: string, status: MissionStepStatus) {
    const updated = await this.stepRepo.update(id, { status });

    await this.pushLog(missionId, `Step status changed to ${status}`, id, 'status_change');

    return updated;
  }

  async pushLog(missionId: string, message: string, stepId?: string, type: 'log' | 'status_change' = 'log', payload?: any) {
    this.logSubject.next({
      missionId,
      stepId,
      type,
      message,
      payload,
    });

    try {
      await this.logRepo.createLog({
        missionId,
        message,
        stepId,
        type,
        payload,
      });
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

        await this.addStep(id, 'Finalizing Mission', 'COMPLETED');
        this.logger.log(`Mission ${id} finished. Result: ${result.answer.slice(0, 100)}...`);
        await this.updateMissionStatus(id, 'COMPLETED');
        await this.pushLog(id, 'Mission completed successfully!');
      } catch (error) {
        this.logger.error(`Mission ${id} failed:`, error);
        await this.updateMissionStatus(id, 'FAILED');
        await this.pushLog(id, `Mission failed: ${error.message}`);
      }
    })();
  }
}
