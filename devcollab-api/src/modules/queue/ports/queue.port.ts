export abstract class QueuePort {
  abstract sendMessage(messageBody: object): Promise<void>;
}
