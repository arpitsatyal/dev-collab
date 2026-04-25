export enum QueueType {
  DEFAULT = 'DEFAULT',
  MISSION = 'MISSION',
}

export abstract class QueuePort {
  abstract sendMessage(messageBody: object, type?: QueueType): Promise<void>;
}
