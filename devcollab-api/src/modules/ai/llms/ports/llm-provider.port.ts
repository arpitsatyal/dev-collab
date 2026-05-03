import { LlmModel } from '../interfaces/llm.types';
import { LlmTaskType } from '../enums/llm-task-type.enum';

export abstract class LlmProviderPort {
  abstract create(type?: LlmTaskType): LlmModel;
}
