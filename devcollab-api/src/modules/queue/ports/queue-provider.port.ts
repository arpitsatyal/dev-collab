export abstract class QueueProviderPort {
  abstract sendRawMessage(url: string, body: string): Promise<void>;
}
