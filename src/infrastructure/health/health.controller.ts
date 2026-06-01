import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'core/decorators/public.decorator';

/**
 * Liveness + readiness probes for load balancers and orchestrators (k8s).
 *
 *  - GET /healthz          → liveness: process is up and the framework responds.
 *  - GET /healthz/ready    → readiness: every external dependency this app
 *                            needs to serve traffic is reachable.
 *
 * Both endpoints sit outside the `/api/v1` prefix (see configure-routing.ts)
 * so probes don't need to know the API version and don't go through the
 * versioning router. SkipThrottle keeps high-frequency probes from eating
 * the per-IP rate-limit budget.
 */
@Public()
@SkipThrottle()
@Controller('healthz')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
