import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { AuthPort } from './ports/auth.port';
import { ValidateSocialUserRequest } from './interfaces/auth.interfaces';

@Injectable()
export class AuthService implements AuthPort {
  constructor(
    private readonly usersService: UsersService
  ) { }

  async validateSocialUser(profileData: ValidateSocialUserRequest) {
    const { email, name, provider, providerId, image } = profileData;

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createUser({
        email,
        name,
        provider,
        providerId,
        image,
      });
    }

    return user;
  }
}
