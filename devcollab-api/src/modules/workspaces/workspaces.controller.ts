import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  CreateWorkspaceDto,
  ImportRepositoryDto,
  RepoTreeQueryDto,
  TogglePinDto,
} from './dto/workspaces.dto';
import { CurrentUser } from '../users/user.decorator';
import type { User } from '../../common/drizzle/schema';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  getWorkspaces(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: User | null,
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.workspacesService.getWorkspaces({
      user,
      skip: query.skip,
      take: query.limit,
    });
  }

  @Get('import/tree')
  fetchRepoTree(@Query() query: RepoTreeQueryDto) {
    return this.workspacesService.fetchRepoTree(query.url);
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
    @Body() body: TogglePinDto,
    @CurrentUser() user: User,
  ) {
    return this.workspacesService.togglePinWorkspace(body, user, id);
  }
}
