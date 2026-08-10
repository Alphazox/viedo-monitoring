import type { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import type { PrismaHealthIndicator } from './prisma-health.indicator';
import type { RedisHealthIndicator } from './redis-health.indicator';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController(
      {} as HealthCheckService,
      {} as PrismaHealthIndicator,
      {} as RedisHealthIndicator,
    );
  });

  it('reports liveness as ok', () => {
    expect(controller.liveness()).toEqual({ status: 'ok' });
  });
});
