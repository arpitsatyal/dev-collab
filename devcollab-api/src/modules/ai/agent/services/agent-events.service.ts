import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentEvents } from '../enums/agent-events.enum';
import { AgentActionEvent, AgentConfigurable } from '../interfaces/agent.interfaces';

@Injectable()
export class AgentEventsService {
  constructor(private readonly eventEmitter: EventEmitter2) { }

  emitAction(
    metadata: AgentConfigurable,
    type: 'TOOL_START' | 'TOOL_END' | 'REASONING_START' | 'REASONING_END',
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
