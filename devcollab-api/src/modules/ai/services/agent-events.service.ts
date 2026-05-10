import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentEvents, AgentActionType } from 'src/modules/ai/agent/enums/agent.enums';
import { AgentActionEvent, AgentConfigurable } from 'src/modules/ai/agent/types/agent.types';

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
