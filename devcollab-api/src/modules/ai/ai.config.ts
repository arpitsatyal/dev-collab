import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfig {
  readonly maxIterations = 5;
  readonly appScopeReply =
    'I can assist with Dev-Collab only, including workspaces, work items, snippets, documentation, and workspace code. Please ask a question related to your application data or workflow.';
}
