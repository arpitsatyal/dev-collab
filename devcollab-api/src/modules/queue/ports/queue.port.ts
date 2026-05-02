import { QueueType } from '../enums/queue-type.enum';

export abstract class QueuePort {
  abstract sendMessage(messageBody: object, type?: QueueType): Promise<void>;
}
