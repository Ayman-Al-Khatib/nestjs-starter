import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { seconds, ThrottlerModule } from '@nestjs/throttler';
import { EnvironmentConfig } from 'infrastructure/config';
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
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentConfig>) => ({
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
      }),
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
