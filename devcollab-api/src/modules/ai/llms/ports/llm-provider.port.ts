import { LlmModel } from '../interfaces/llm.interfaces';
import { LlmTaskType } from '../enums/llm-task-type.enum';

export abstract class LlmProviderPort {
  abstract create(type?: LlmTaskType): LlmModel;
}
