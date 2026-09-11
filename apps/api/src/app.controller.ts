import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Auth } from './auth/decorators/auth.decorator';
import { Role } from './common/enums/role.enum';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from './auth/decorators/current-user.decorator';

@Controller()
export class AppController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('ping-authenticated')
  @Auth()
  pingAuthenticated(@CurrentUser() user: CurrentUserPayload) {
    return { message: 'You are logged in', user };
  }

  @Get('ping-manager-only')
  @Auth(Role.MANAGER)
  pingManagerOnly(@CurrentUser() user: CurrentUserPayload) {
    return { message: 'You are a manager', user };
  }

  @Get()
  getRoot() {
    return {
      name: 'Weekly Report Generator API',
      version: '0.1.0',
    };
  }

  @Get('health')
  getHealth() {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    return {
      status: 'ok',
      database: {
        state: states[this.connection.readyState] ?? 'unknown',
        name: this.connection.name,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
