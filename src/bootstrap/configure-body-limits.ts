import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { EnvironmentConfig } from 'infrastructure/config';

export function configureBodyLimits(
  app: NestExpressApplication,
  config: ConfigService<EnvironmentConfig>,
): void {
  const limit = config.getOrThrow<string>('BODY_LIMIT');
  app.use(json({ limit }));
  app.use(urlencoded({ extended: true, limit }));
}
