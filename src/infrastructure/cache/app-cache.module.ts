import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from 'infrastructure/config';
import { CacheDriver } from 'infrastructure/config/schemas/cache.schema';
import { CacheService } from './cache.service';
import { CACHE_DRIVER, ICacheDriver } from './drivers/cache-driver.interface';
import { NoopCacheDriver } from './drivers/noop-cache.driver';
import { RedisCacheDriver } from './drivers/redis-cache.driver';

/**
 * Driver factory — picks the implementation based on `CACHE_DRIVER`.
 * `noop` keeps the service injectable while disabling caching entirely;
 * `redis` opens a connection with the validated REDIS_* env values.
 */
const cacheDriverProvider: Provider = {
  provide: CACHE_DRIVER,
  useFactory: (config: ConfigService<EnvironmentConfig>): ICacheDriver => {
    const driver = config.getOrThrow<string>('CACHE_DRIVER');
    if (driver === CacheDriver.REDIS) {
      return new RedisCacheDriver({
        host: config.getOrThrow<string>('REDIS_HOST'),
        port: config.getOrThrow<number>('REDIS_PORT'),
        password: config.get<string>('REDIS_PASSWORD'),
        db: config.getOrThrow<number>('REDIS_DB'),
        keyPrefix: config.getOrThrow<string>('REDIS_KEY_PREFIX'),
      });
    }
    return new NoopCacheDriver();
  },
  inject: [ConfigService],
};

/**
 * Global so any feature service can inject `CacheService` without
 * re-importing this module.
 */
@Global()
@Module({
  providers: [cacheDriverProvider, CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
