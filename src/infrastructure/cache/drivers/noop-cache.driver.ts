// NoopCacheDriver satisfies ICacheDriver while caching is disabled, so every
// parameter is intentionally ignored — hence the `_`-prefixed names.
import { Injectable } from '@nestjs/common';
import { ICacheDriver } from './cache-driver.interface';

/**
 * Disabled-cache implementation. Every read returns `null`, every write
 * is silently dropped. Lets CacheService stay injected and `getOrSet`
 * call sites stay unchanged while caching is turned off.
 */
@Injectable()
export class NoopCacheDriver implements ICacheDriver {
  get<T>(_key: string): Promise<T | null> {
    return Promise.resolve(null);
  }

  set<T>(_key: string, _value: T, _ttlSeconds: number): Promise<void> {
    return Promise.resolve();
  }

  delete(_key: string): Promise<void> {
    return Promise.resolve();
  }

  deletePattern(_pattern: string): Promise<void> {
    return Promise.resolve();
  }
}
