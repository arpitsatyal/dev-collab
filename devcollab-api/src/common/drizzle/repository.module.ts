import { Global, Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle.module';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { WorkItemRepository } from 'src/modules/work-items/repositories/work-item.repository';
import { SnippetRepository } from 'src/modules/snippets/repositories/snippet.repository';
import { DocRepository } from 'src/modules/docs/repositories/doc.repository';
import { WorkspaceRepository } from 'src/modules/workspaces/adapters/workspace.repository';
import { WorkspaceImportRepository } from 'src/modules/workspaces/adapters/workspace-import.repository';
import { MissionRepository } from 'src/modules/mission/repositories/mission.repository';
import { MissionStepRepository } from 'src/modules/mission/repositories/mission-step.repository';
import { MissionLogRepository } from 'src/modules/mission/repositories/mission-log.repository';
import { ChatRepository } from 'src/modules/chat/repositories/chat.repository';
import { MessageRepository } from 'src/modules/message/repositories/message.repository';

const repositories = [
  UserRepository,
  WorkItemRepository,
  SnippetRepository,
  DocRepository,
  WorkspaceRepository,
  WorkspaceImportRepository,
  MissionRepository,
  MissionStepRepository,
  MissionLogRepository,
  ChatRepository,
  MessageRepository,
];

@Global()
@Module({
  imports: [DrizzleModule],
  providers: [...repositories],
  exports: [...repositories],
})
export class RepositoryModule { }
