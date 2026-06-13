import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentEvents, AgentActionType } from './agent-events.enums';
import { AgentActionEvent, AgentConfigurable } from './agent-events.types';

@Injectable()
export class EventBusService {
  constructor(private readonly eventEmitter: EventEmitter2) { }

  /**
   * Emit an agent-related action event
   */
  emitAgentAction(
    metadata: AgentConfigurable,
    type: AgentActionType,
    label: string,
    callId?: string,
    payload?: any,
  ) {
    this.eventEmitter.emit(
      AgentEvents.ACTION,
      new AgentActionEvent(metadata, type, label, callId, payload),
    );
  }

  /**
   * Generic emit for any other event types
   */
  emit(event: string, ...values: any[]) {
    return this.eventEmitter.emit(event, ...values);
  }
}
