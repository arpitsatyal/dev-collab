import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from './repositories/user.repository';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SnippetsModule } from '../snippets/snippets.module';
import { DocsModule } from '../docs/docs.module';
import { WorkItemsModule } from '../work-items/work-items.module';

@Module({
  imports: [
    WorkspacesModule,
    SnippetsModule,
    DocsModule,
    WorkItemsModule,
  ],
  providers: [UsersService, UserRepository],
  controllers: [UsersController],
  exports: [UsersService, UserRepository],
})
export class UsersModule { }
