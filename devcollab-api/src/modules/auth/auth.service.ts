import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { AuthPort } from './ports/auth.port';
import { ValidateSocialUserRequest } from './types/auth.types';

@Injectable()
export class AuthService implements AuthPort {
  constructor(
    private readonly usersService: UsersService
  ) { }

  async validateSocialUser(request: ValidateSocialUserRequest) {

    let user = await this.usersService.findByEmail(request.email);
    if (!user) {
      user = await this.usersService.createUser(request);
    }

    return user;
  }
}
