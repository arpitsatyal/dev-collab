import { BaseMessage } from '@langchain/core/messages';

export abstract class OrchestratorPromptPort {
  abstract buildSupervisorRouterSystemPrompt(): string;

  abstract buildWorkerSystemPrompt(
    workerAgentNode: string,
    workerToolNames: string[],
  ): string;

  abstract buildCriticMessages(
    missionContext: string | undefined,
    lastWorkerNode: string,
    workerLog: string,
    revisionHistory: string,
  ): BaseMessage[];

  abstract buildCorrectionMessages(
    revisionCount: number,
    lastWorkerNode: string,
    revisionsRequested: string[],
  ): BaseMessage[];
}
