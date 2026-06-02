// Force the entire process to run in UTC. Must run before any other module
// is imported so that no captured TZ leaks in. Affects Date.toString(),
// getHours(), Intl, etc. — getTime()/toISOString() are always UTC anyway.
process.env.TZ = 'UTC';

import { INestApplication, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  configureBodyLimits,
  configureRouting,
  configureSecurity,
  configureTrustProxy,
  enableClassValidatorDI,
} from 'bootstrap';
import { EnvironmentConfig } from 'infrastructure/config';
import { AppModule } from './app.module';

const DEFAULT_PORT = 3000;
const LOG_LEVELS: LogLevel[] = ['error', 'debug', 'log', 'verbose', 'fatal', 'warn'];

function resolvePort(app: INestApplication): number {
  // Honor a platform-injected PORT (Render / Railway / Heroku / Cloud Run)
  // first, then the validated APP_PORT, then the default. Without this, a
  // platform that assigns a dynamic PORT would be ignored and health checks
  // against that port would fail.
  const platformPort = Number(process.env.PORT);
  if (Number.isInteger(platformPort) && platformPort > 0) {
    return platformPort;
  }
  return app.get(ConfigService).get<number>('APP_PORT', DEFAULT_PORT);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: LOG_LEVELS,
  });

  const config = app.get(ConfigService<EnvironmentConfig>);

  enableClassValidatorDI(app);
  configureTrustProxy(app, config);
  configureBodyLimits(app, config);
  configureSecurity(app, config);
  configureRouting(app);
  app.enableShutdownHooks();

  const port = resolvePort(app);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
