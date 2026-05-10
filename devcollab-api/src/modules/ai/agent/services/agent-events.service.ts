import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentEvents, AgentActionType } from '../enums/agent.enums';
import { AgentActionEvent, AgentConfigurable } from '../interfaces/agent.interfaces';

@Injectable()
export class AgentEventsService {
  constructor(private readonly eventEmitter: EventEmitter2) { }

  emitAction(
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
}
