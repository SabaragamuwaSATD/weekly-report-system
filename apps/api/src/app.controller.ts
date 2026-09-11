import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

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
