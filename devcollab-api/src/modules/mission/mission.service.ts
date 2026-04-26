import { Injectable, Logger } from '@nestjs/common';
import { MissionRepository } from './repositories/mission.repository';
import { MissionStepRepository } from './repositories/mission-step.repository';
import { MissionLogRepository } from './repositories/mission-log.repository';
import { MissionStatus } from 'src/common/drizzle/schema';
import { Subject, concatMap, from } from 'rxjs';
import { AgentPort } from '../ai/ports/agent.port';
import { HumanMessage } from '@langchain/core/messages';
import { OnEvent } from '@nestjs/event-emitter';
import { AgentEvents, AgentActionEvent } from '../ai/agent/agent.events';
import { QueuePort, QueueType } from '../queue/ports/queue.port';
import {
  AddStepOptions,
  CreateMissionOptions,
  MissionLog,
  PushLogOptions,
  UpdateStepStatusOptions
} from './mission.types';

@Injectable()
export class MissionService {
  private readonly logger = new Logger(MissionService.name);
  private readonly logSubject = new Subject<MissionLog>();

  // The magic for the Persistence Tax: A sequential background queue
  private readonly eventQueue = new Subject<AgentActionEvent>();

  constructor(
    private readonly missionRepo: MissionRepository,
    private readonly stepRepo: MissionStepRepository,
    private readonly logRepo: MissionLogRepository,
    private readonly agentPort: AgentPort,
    private readonly queuePort: QueuePort,
  ) {
    // Initialize the background processor
    this.eventQueue.pipe(
      // concatMap ensures every event is processed one-by-one IN ORDER
      concatMap(event => from(this.processAgentAction(event)))
    ).subscribe({
      error: (err) => this.logger.error(`Error in background mission event processing: ${err.message}`)
    });
  }

  @OnEvent(AgentEvents.ACTION)
  handleAgentAction(event: AgentActionEvent) {
    this.eventQueue.next(event);
  }

  /**
   * Internal processor for the queue. 
   * This is where the actual DB writes happen.
   */
  private async processAgentAction(event: AgentActionEvent) {
    const { missionId, type, label, payload, callId } = event;

    try {
      switch (type) {
        case 'REASONING_START':
          await this.pushLog({ missionId, message: label });
          break;
        case 'TOOL_START': {
          const step = await this.addStep({
            missionId,
            label,
            status: 'RUNNING',
            payload: { callId },
          });
          await this.pushLog({
            missionId,
            message: `Agent executing ${payload?.tool || 'tool'}`,
            stepId: step.id,
          });
          break;
        }
        case 'TOOL_END': {
          const mission = await this.getMission(missionId);
          const runningStep = mission?.steps?.find(
            (s) => (s.payload as any)?.callId === callId,
          );
          if (runningStep) {
            await this.updateStepStatus({
              id: runningStep.id,
              missionId,
              status: 'COMPLETED',
            });
          }
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process agent action ${type} for mission ${missionId}: ${error.message}`);
    }
  }

  getLogObservable() {
    return this.logSubject.asObservable();
  }

  async createMission(options: CreateMissionOptions) {
    const { workspaceId, goal } = options;
    return await this.missionRepo.create({
      workspaceId,
      goal,
      status: 'PENDING',
    });
  }

  async getMission(id: string) {
    return await this.missionRepo.findById(id);
  }

  async getWorkspaceMissions(workspaceId: string) {
    return await this.missionRepo.findByWorkspaceId(workspaceId);
  }

  async addStep(options: AddStepOptions) {
    const { missionId, label, status = 'PENDING', payload } = options;
    const step = await this.stepRepo.create({
      missionId,
      label,
      status,
      payload,
    });

    return step;
  }

  async updateMissionStatus(id: string, status: MissionStatus) {
    const updated = await this.missionRepo.update(id, { status, updatedAt: new Date() });
    await this.pushLog({
      missionId: id,
      message: `Mission status changed to ${status}`,
      type: 'status_change',
    });
    return updated;
  }

  async updateStepStatus(options: UpdateStepStatusOptions) {
    const { id, missionId, status } = options;
    const updated = await this.stepRepo.update(id, { status });
    await this.pushLog({
      missionId,
      message: `Step status changed to ${status}`,
      stepId: id,
      type: 'status_change',
    });
    return updated;
  }

  async pushLog(options: PushLogOptions) {
    const { missionId, message, stepId, type = 'log', payload } = options;

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
    await this.pushLog({
      missionId: id,
      message: 'Mission queued for execution...',
    });

    // Dispatch to SQS for background processing
    await this.queuePort.sendMessage(
      { type: 'RUN_MISSION', missionId: id },
      QueueType.MISSION
    );
  }

  /**
   * Actual logic executed by the background worker
   */
  async executeMission(id: string) {
    const mission = await this.getMission(id);
    if (!mission) return;

    try {
      await this.pushLog({
        missionId: id,
        message: `Launching autonomous agent for goal: ${mission.goal}`,
      });

      const result = await this.agentPort.runAgentGraph(
        [new HumanMessage(mission.goal)],
        mission.workspaceId,
        id,
      );

      await this.addStep({
        missionId: id,
        label: 'Finalizing Mission',
        status: 'COMPLETED',
      });
      this.logger.log(`Mission ${id} finished. Result: ${result.answer.slice(0, 100)}...`);
      await this.updateMissionStatus(id, 'COMPLETED');
      await this.pushLog({
        missionId: id,
        message: 'Mission completed successfully!',
      });
    } catch (error) {
      this.logger.error(`Mission ${id} failed:`, error);
      await this.updateMissionStatus(id, 'FAILED');
      await this.pushLog({
        missionId: id,
        message: `Mission failed: ${error.message}`,
      });
    }
  }
}
