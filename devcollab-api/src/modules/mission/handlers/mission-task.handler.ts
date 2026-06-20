import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Subject, concatMap, from } from 'rxjs';
import { AgentEvents, AgentActionType } from 'src/common/events/agent-events.enums';
import { AgentActionEvent } from 'src/common/events/agent-events.types';
import { MissionService } from '../services/mission.service';
import { MissionStepStatus } from '../enums/mission.enums';

@Injectable()
export class MissionTaskHandler {
  private readonly logger = new Logger(MissionTaskHandler.name);
  private readonly eventQueue = new Subject<AgentActionEvent>();

  constructor(private readonly missionService: MissionService) {
    // Initialize the background processor to ensure sequential updates
    this.eventQueue
      .pipe(
        concatMap((event) => from(this.processAgentAction(event))),
      )
      .subscribe({
        error: (err) =>
          this.logger.error(
            `Error in background mission event processing: ${err.message}`,
          ),
      });
  }

  @OnEvent(AgentEvents.ACTION)
  handleAgentAction(event: AgentActionEvent) {
    this.eventQueue.next(event);
  }

  private async processAgentAction(event: AgentActionEvent) {
    const { metadata, type, label, payload, callId } = event;
    const missionId = metadata?.missionId;

    if (!missionId) return;

    try {
      switch (type) {
        case AgentActionType.REASONING_START:
          await this.missionService.pushLog({ missionId, message: label });
          break;
        case AgentActionType.TOOL_START: {
          const mission = await this.missionService.getMission(missionId);
          const alreadyExists = mission?.steps?.some(
            (s) => (s.payload as any)?.callId === callId,
          );
          if (alreadyExists) return;

          await this.missionService.addStep({
            missionId,
            label: `Executing ${payload?.tool || 'tool'}`,
            status: MissionStepStatus.RUNNING,
            payload: { callId },
          });
          break;
        }
        case AgentActionType.TOOL_END: {
          const mission = await this.missionService.getMission(missionId);
          const runningStep = mission?.steps?.find(
            (s) => (s.payload as any)?.callId === callId,
          );
          if (runningStep) {
            await this.missionService.updateStepStatus({
              id: runningStep.id,
              missionId,
              status: MissionStepStatus.COMPLETED,
            });
          }
          break;
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process agent action ${type} for mission ${missionId}: ${error.message}`,
      );
    }
  }
}
