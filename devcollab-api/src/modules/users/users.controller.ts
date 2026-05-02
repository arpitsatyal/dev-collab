import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from './user.decorator';
import {
  SearchUserQueryDto,
  CollaborationUsersQueryDto,
} from './dto/users.dto';
import type { User } from '../../common/drizzle/schema';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.findAll();
  }

  @Get('search/by-name')
  search(@Query() query: SearchUserQueryDto) {
    return this.usersService.searchByName(query.text);
  }

  @Get('stats/me')
  stats(@CurrentUser() user: User) {
    return this.usersService.getStatsByEmail(user.email!);
  }

  @Get('collaboration')
  collaboration(@Query() query: CollaborationUsersQueryDto) {
    return this.usersService.getCollaborationUsers(query.userIds);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
