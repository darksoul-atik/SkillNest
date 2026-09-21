import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'System health check' })
  @ApiResponse({ status: 200, description: 'Health status' })
  check() {
    const isDbReady = this.connection.readyState === 1;
    return {
      status: isDbReady ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: isDbReady ? 'up' : 'down',
      },
    };
  }
}
