export type EventType = 'workspace' | 'workItem' | 'snippet' | 'doc';

export abstract class SyncEventPort {
  abstract publishSyncEvent(
    type: EventType,
    data: any,
    action?: 'upsert' | 'delete',
  ): Promise<string | void>;
}
