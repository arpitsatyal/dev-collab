import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CreateWorkspaceDto, ImportRepositoryDto } from './dto/workspaces.dto';
import { CurrentUser } from '../users/user.decorator';
import type { User } from '../../common/drizzle/schema';
import { SessionAuthGuard } from '../../common/guards/auth.guard';

@Controller('workspaces')
@UseGuards(SessionAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) { }

  @Get()
  getWorkspaces(@Query() query: PaginationQueryDto, @CurrentUser() user: User | null) {
    const skip = parseInt(query.skip ?? '10');
    const take = parseInt(query.limit ?? '10');

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.workspacesService.getWorkspaces({ user, skip, take });
  }

  @Get('import/tree')
  fetchRepoTree(@Query('url') url: string) {
    return this.workspacesService.fetchRepoTree(url);
  }

  @Post('import')
  importRepository(
    @Body() body: ImportRepositoryDto,
    @CurrentUser() user: User,
  ) {
    return this.workspacesService.importRepository({
      url: body.url,
      selectedFiles: body.selectedFiles,
      user,
    });
  }

  @Get(':id')
  getWorkspace(@Param('id') id: string) {
    return this.workspacesService.getWorkspace(id);
  }

  @Post()
  addNewWorkspace(@Body() body: CreateWorkspaceDto, @CurrentUser() user: User) {
    return this.workspacesService.addNewWorkspace(body, user);
  }

  @Patch(':id')
  togglePinWorkspace(
    @Param('id') id: string,
    @Body() body: { isPinned: boolean },
    @CurrentUser() user: User,
  ) {
    return this.workspacesService.togglePinWorkspace(body, user, id);
  }
}
