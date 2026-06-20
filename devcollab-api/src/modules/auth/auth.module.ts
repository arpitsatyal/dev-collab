import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthPort } from './ports/auth.port';
import { GoogleStrategy } from './adapters/google.strategy';
import { GithubStrategy } from './adapters/github.strategy';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from './adapters/session.serializer';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [PassportModule.register({ session: true }), UsersModule],
  providers: [
    AuthService,
    { provide: AuthPort, useClass: AuthService },
    SessionSerializer,
    GoogleStrategy,
    GithubStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, AuthPort],
})
export class AuthModule {}
