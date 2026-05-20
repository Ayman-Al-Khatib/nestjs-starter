import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EnvironmentConfig } from 'infrastructure/config';

export function configureTrustProxy(
  app: NestExpressApplication,
  config: ConfigService<EnvironmentConfig>,
): void {
  // `trust proxy` must be set before any middleware that reads req.ip
  // (throttler, logger, etc.) so the X-Forwarded-For chain is honoured.
  const trustProxy = config.getOrThrow<string>('TRUST_PROXY');
  app.set('trust proxy', parseTrustProxy(trustProxy));
}

function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const asNumber = Number(value);
  return Number.isInteger(asNumber) && asNumber >= 0 ? asNumber : value;
}
