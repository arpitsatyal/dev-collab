import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from './user.decorator';
import type { User } from '../../common/drizzle/schema';

@Controller('users')
@UseGuards(SessionAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.findAll();
  }

  @Get('search/by-name')
  search(@Query('text') text: string) {
    return this.usersService.searchByName(text);
  }

  @Get('stats/me')
  stats(@CurrentUser() user: User) {
    return this.usersService.getStatsByEmail(user.email!);
  }

  @Get('collaboration')
  collaboration(@Query('userIds') userIds: string | string[]) {
    let ids: string[] = [];
    if (Array.isArray(userIds)) {
      ids = userIds;
    } else if (typeof userIds === 'string') {
      ids = userIds.split(',');
    }
    return this.usersService.getCollaborationUsers(ids);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
