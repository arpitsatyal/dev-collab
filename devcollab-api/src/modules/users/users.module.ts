import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from './repositories/user.repository';

@Module({
  providers: [UsersService, UserRepository],
  controllers: [UsersController],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
