import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { GithubStrategy } from './github.strategy';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from './session.serializer.';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    UsersModule,
  ],
  providers: [
    SessionSerializer,
    GoogleStrategy,
    GithubStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
