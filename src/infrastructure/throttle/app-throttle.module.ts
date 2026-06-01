import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { seconds, ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { EnvironmentConfig } from 'infrastructure/config';
import { CacheDriver } from 'infrastructure/config/schemas/cache.schema';
import { Translator } from 'infrastructure/i18n';
import { AppThrottlerGuard } from './app-throttler.guard';

/**
 * Globally rate-limits every HTTP route. Three named throttlers are
 * registered; `AppThrottlerGuard` picks exactly one per request based on
 * `@AuthThrottle()` / `@UploadThrottle()` metadata.
 *
 * IP resolution relies on Express' `trust proxy` setting being correct —
 * configured at bootstrap from `TRUST_PROXY`.
 *
 * The 429 response body is translated per-request via `Translator.trStatic`,
 * which reads the active `I18nContext` set by the language resolvers.
 *
 * Storage: in-memory by default. When CACHE_DRIVER=redis the counters move to
 * Redis so the per-IP budget is shared across instances — without this, N
 * replicas behind a load balancer would each allow the full limit, multiplying
 * the effective rate cap by N and weakening brute-force protection.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildThrottlerOptions,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppThrottleModule {}

function buildThrottlerOptions(
  config: ConfigService<EnvironmentConfig>,
): ThrottlerModuleOptions {
  const options: ThrottlerModuleOptions = {
    errorMessage: () => Translator.trStatic('common.errors.too_many_requests'),
    throttlers: [
      {
        name: 'default',
        ttl: seconds(config.getOrThrow<number>('THROTTLE_TTL_SECONDS')),
        limit: config.getOrThrow<number>('THROTTLE_LIMIT'),
      },
      {
        name: 'auth',
        ttl: seconds(config.getOrThrow<number>('AUTH_THROTTLE_TTL_SECONDS')),
        limit: config.getOrThrow<number>('AUTH_THROTTLE_LIMIT'),
      },
      {
        name: 'upload',
        ttl: seconds(config.getOrThrow<number>('UPLOAD_THROTTLE_TTL_SECONDS')),
        limit: config.getOrThrow<number>('UPLOAD_THROTTLE_LIMIT'),
      },
    ],
  };

  if (config.getOrThrow<string>('CACHE_DRIVER') === CacheDriver.REDIS) {
    const keyPrefix = config.getOrThrow<string>('REDIS_KEY_PREFIX');
    const password = config.get<string>('REDIS_PASSWORD');
    // Self-manages its connection lifecycle (OnModuleDestroy quits it).
    options.storage = new ThrottlerStorageRedisService({
      host: config.getOrThrow<string>('REDIS_HOST'),
      port: config.getOrThrow<number>('REDIS_PORT'),
      db: config.getOrThrow<number>('REDIS_DB'),
      keyPrefix: `${keyPrefix}:throttle:`,
      lazyConnect: true,
      ...(password ? { password } : {}),
    });
  }

  return options;
}
