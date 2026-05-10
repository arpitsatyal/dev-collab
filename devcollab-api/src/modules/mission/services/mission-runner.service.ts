import { Injectable, Logger } from '@nestjs/common';
import { AgentPort } from 'src/modules/ai/agent/ports/agent.port';
import { HumanMessage } from '@langchain/core/messages';
import { QueuePort } from 'src/modules/queue/ports/queue.port';
import { QueueType } from 'src/modules/queue/enums/queue-type.enum';
import { MissionPromptsService } from './mission-prompts.service';
import { MissionService } from './mission.service';

@Injectable()
export class MissionRunnerService {
  private readonly logger = new Logger(MissionRunnerService.name);

  constructor(
    private readonly missionService: MissionService,
    private readonly agentPort: AgentPort,
    private readonly queuePort: QueuePort,
    private readonly prompts: MissionPromptsService,
  ) { }

  /**
   * Orchestrates the high-level flow of queuing a mission.
   */
  async runMission(id: string) {
    const mission = await this.missionService.getMission(id);
    if (!mission) throw new Error('Mission not found');

    await this.missionService.updateMissionStatus(id, 'RUNNING');
    await this.missionService.pushLog({
      missionId: id,
      message: 'Mission queued for execution...',
    });

    await this.queuePort.sendMessage(
      { type: 'RUN_MISSION', missionId: id },
      QueueType.MISSION,
    );
  }

  /**
   * The actual execution logic (usually called by a background worker).
   */
  async executeMission(id: string, messages?: any[], autoApprove = false) {
    const mission = await this.missionService.getMission(id);
    if (!mission) return;

    if (mission.status === 'COMPLETED' || mission.status === 'FAILED') {
      this.logger.warn(
        `Mission ${id} is already in ${mission.status} state. Skipping execution.`,
      );
      return;
    }

    try {
      await this.missionService.pushLog({
        missionId: id,
        message: messages && messages.length > 0
          ? 'Resuming mission with user feedback...'
          : `Launching autonomous agent for goal: ${mission.goal}`,
      });

      // If we are resuming (messages provided), we pass them directly.
      // If it's a new run, we MUST include the steering prompt.
      let initialMessages: any[];
      if (messages) {
        initialMessages = messages;
      } else {
        const steeringPrompt = this.prompts.getSteeringPrompt(mission.workspaceId);
        initialMessages = [steeringPrompt, new HumanMessage(mission.goal)];
      }

      const result = await this.agentPort.execute(
        initialMessages,
        mission.workspaceId,
        {
          threadId: id,
          configurable: { missionId: id },
          autoApprove,
        },
      );

      if (result.interrupted) {
        await this.missionService.updateMissionStatus(id, 'WAITING_FOR_USER');
        await this.missionService.pushLog({
          missionId: id,
          message: result.answer,
          type: 'log',
        });
        return;
      }

      await this.missionService.addStep({
        missionId: id,
        label: 'Finalizing Mission',
        status: 'COMPLETED',
      });

      this.logger.log(
        `Mission ${id} finished. Result: ${result.answer.slice(0, 100)}...`,
      );
      await this.missionService.updateMissionStatus(id, 'COMPLETED');
      await this.missionService.pushLog({
        missionId: id,
        message: 'Mission completed successfully!',
      });
    } catch (error) {
      this.logger.error(`Mission ${id} failed:`, error);
      await this.missionService.updateMissionStatus(id, 'FAILED');
      await this.missionService.pushLog({
        missionId: id,
        message: `Mission failed: ${error.message}`,
      });
    }
  }

  async resumeMission(id: string, action: 'APPROVE' | 'REJECT', feedback?: string) {
    const mission = await this.missionService.getMission(id);
    if (!mission) throw new Error('Mission not found');

    if (mission.status !== 'WAITING_FOR_USER') {
      throw new Error('Mission is not waiting for user approval');
    }

    await this.missionService.updateMissionStatus(id, 'RUNNING');

    if (action === 'APPROVE') {
      // Resume with empty messages to continue from checkpoint, and enable auto-approval
      // for the rest of the mission to avoid repeatedly asking the user.
      return this.executeMission(id, [], true);
    } else {
      // Abort the mission
      this.logger.log(`Mission ${id} aborted by user.`);
      await this.missionService.updateMissionStatus(id, 'FAILED');
      await this.missionService.pushLog({
        missionId: id,
        message: `Mission aborted by user. Feedback: ${feedback || 'None'}`,
      });
      return;
    }
  }
}
