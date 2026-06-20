import { QueueType } from '../enums/queue.enums';

export abstract class QueuePort {
  abstract sendMessage(messageBody: object, type?: QueueType): Promise<void>;
}
