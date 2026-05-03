import { Injectable, Logger } from '@nestjs/common';
import { AgentPort } from '../../ai/agent/ports/agent.port';
import { HumanMessage } from '@langchain/core/messages';
import { QueuePort } from '../../queue/ports/queue.port';
import { QueueType } from '../../queue/enums/queue-type.enum';
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
  async executeMission(id: string) {
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
        message: `Launching autonomous agent for goal: ${mission.goal}`,
      });

      const steeringPrompt = this.prompts.getSteeringPrompt(mission.workspaceId);

      const result = await this.agentPort.runAgentGraph(
        [steeringPrompt, new HumanMessage(mission.goal)],
        mission.workspaceId,
        {
          threadId: id,
          configurable: { missionId: id },
        },
      );

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
}
