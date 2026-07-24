import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

/** Endpoint de liveness: lo usan el healthcheck de Docker y el proxy del VPS. */
@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Estado del servicio' })
  check(): { status: string; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
