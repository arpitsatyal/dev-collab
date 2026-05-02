import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { User } from 'src/common/drizzle/schema';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UsersService) {
    super();
  }

  serializeUser(user: User, done: (err: any, user: any) => void) {
    done(null, user);
  }

  async deserializeUser(user: User, done: (err: any, user: any) => void) {
    const userDB = await this.userService.findById(user.id);
    return userDB ? done(null, userDB) : done(null, null);
  }
}
