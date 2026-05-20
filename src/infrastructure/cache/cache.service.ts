import { Inject, Injectable } from '@nestjs/common';
import { CACHE_DRIVER, ICacheDriver } from './drivers/cache-driver.interface';

/**
 * Process-wide cache facade. Always injectable — the driver decides
 * whether reads/writes actually hit a backend (Redis) or are dropped
 * (Noop). Toggling `CACHE_DRIVER` in env never requires editing a
 * call site.
 *
 * Values are JSON-serialized by Redis driver — caching a class
 * instance loses prototype methods/getters on read. For entities,
 * rehydrate with `plainToInstance` at the call site if methods are
 * needed.
 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_DRIVER) private readonly driver: ICacheDriver) {}

  get<T>(key: string): Promise<T | null> {
    return this.driver.get<T>(key);
  }

  set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    return this.driver.set(key, value, ttlSeconds);
  }

  delete(key: string): Promise<void> {
    return this.driver.delete(key);
  }

  /**
   * Bulk-removes every key matching the glob pattern (e.g. `auth:user:*`).
   * Redis uses non-blocking SCAN under the hood. No-op under the Noop driver.
   */
  deletePattern(pattern: string): Promise<void> {
    return this.driver.deletePattern(pattern);
  }

  /**
   * Read-through helper. Returns the cached value when present;
   * otherwise calls `factory`, stores its result, and returns it.
   *
   * `null` / `undefined` factory results are NOT cached so the next
   * call still re-resolves (avoids caching "not found" indefinitely).
   * Under the Noop driver, `factory` runs on every call — there is no
   * caching, by design.
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T | null>,
    ttlSeconds: number,
  ): Promise<T | null> {
    const cached = await this.driver.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await factory();
    if (fresh !== null && fresh !== undefined) {
      await this.driver.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }
}
