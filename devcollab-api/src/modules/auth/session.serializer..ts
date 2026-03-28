import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

import { UsersService } from '../users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UsersService) {
    super();
  }

  serializeUser(user: any, done: (err: Error | null, id: string) => void) {
    done(null, user.id);
  }

  async deserializeUser(
    id: string,
    done: (err: Error | null, user: any | null) => void,
  ) {
    try {
      const user = await this.userService.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
