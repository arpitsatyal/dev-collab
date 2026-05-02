import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { User } from 'src/common/drizzle/schema';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UsersService) {
    super();
  }

  serializeUser(user: User, done: (err: any, id: string) => void) {
    done(null, user.id);
  }

  async deserializeUser(id: string, done: (err: any, user: any) => void) {
    try {
      const userDB = await this.userService.findById(id);
      return done(null, userDB);
    } catch (error) {
      return done(error, null);
    }
  }
}
