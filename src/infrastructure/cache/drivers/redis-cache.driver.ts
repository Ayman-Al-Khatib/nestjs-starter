import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { ICacheDriver } from './cache-driver.interface';

export interface RedisCacheDriverOptions {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
}

const SCAN_BATCH_SIZE = 200;

/**
 * Redis-backed cache driver. Values are JSON-encoded on write and decoded
 * on read; class instances therefore lose their prototype (getters,
 * methods) — callers needing methods on a cached object should rehydrate
 * via class-transformer at the call site.
 *
 * Pattern deletion uses non-blocking SCAN + UNLINK so a large keyspace
 * does not freeze the Redis instance.
 */
@Injectable()
export class RedisCacheDriver implements ICacheDriver, OnModuleDestroy {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor(options: RedisCacheDriverOptions) {
    this.prefix = options.keyPrefix.endsWith(':')
      ? options.keyPrefix
      : `${options.keyPrefix}:`;

    const redisOptions: RedisOptions = {
      host: options.host,
      port: options.port,
      db: options.db,
      // lazyConnect keeps boot fast and surfaces connection errors at first
      // command instead of at module init — important so a Redis outage
      // doesn't block the API from starting.
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    };
    if (options.password) {
      redisOptions.password = options.password;
    }

    this.client = new Redis(redisOptions);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(this.prefixed(key));
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.set(this.prefixed(key), JSON.stringify(value), 'EX', ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.client.unlink(this.prefixed(key));
  }

  async deletePattern(pattern: string): Promise<void> {
    const match = this.prefixed(pattern);
    const stream = this.client.scanStream({ match, count: SCAN_BATCH_SIZE });

    for await (const keys of stream as AsyncIterable<string[]>) {
      if (keys.length > 0) {
        await this.client.unlink(...keys);
      }
    }
  }

  private prefixed(key: string): string {
    return `${this.prefix}${key}`;
  }
}
