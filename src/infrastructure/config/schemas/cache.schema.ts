import { z } from 'zod';

export const CacheDriver = {
  REDIS: 'redis',
  NOOP: 'noop',
} as const;

export type CacheDriverType = (typeof CacheDriver)[keyof typeof CacheDriver];

export const cacheSchema = z.object({
  // 'noop' disables caching entirely — CacheService stays injectable but every
  // call short-circuits. Switch to 'redis' to opt in without touching call sites.
  CACHE_DRIVER: z.enum([CacheDriver.REDIS, CacheDriver.NOOP]).default(CacheDriver.NOOP),

  REDIS_HOST: z.string().min(1).optional(),
  REDIS_PORT: z.coerce.number().int().positive().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),

  // Prefix prepended to every key so multiple apps sharing one Redis can
  // coexist without colliding. Trailing ':' is added automatically.
  REDIS_KEY_PREFIX: z.string().default('nestjs-starter'),
});

const REDIS_REQUIRED_KEYS = ['REDIS_HOST', 'REDIS_PORT'] as const;

export const refineCacheConfig = (
  value: z.infer<typeof cacheSchema>,
  ctx: z.RefinementCtx,
): void => {
  if (value.CACHE_DRIVER === CacheDriver.REDIS) {
    for (const key of REDIS_REQUIRED_KEYS) {
      if (value[key] === undefined || value[key] === null || value[key] === '') {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required when CACHE_DRIVER=redis`,
        });
      }
    }
  }
};

export type CacheConfig = z.infer<typeof cacheSchema>;
