/**
 * Storage backend behind CacheService. Each implementation owns its
 * own connection lifecycle and key formatting; CacheService is a thin
 * facade so call sites never see the driver token.
 */
export interface ICacheDriver {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}

export const CACHE_DRIVER = Symbol('CACHE_DRIVER');
