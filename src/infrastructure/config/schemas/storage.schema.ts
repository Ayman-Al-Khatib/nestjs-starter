import { z } from 'zod';

export const storageSchema = z.object({
  STORAGE_DRIVER: z.enum(['local', 'supabase']).default('local'),
  STORAGE_SIGNING_SECRET: z.string().min(32),

  APP_URL: z.string().url().optional(),
  STORAGE_LOCAL_PATH: z.string().min(1).optional(),

  STORAGE_SUPABASE_URL: z.string().url().optional(),
  STORAGE_SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  STORAGE_SUPABASE_BUCKET_PUBLIC: z.string().min(1).optional(),
  STORAGE_SUPABASE_BUCKET_PRIVATE: z.string().min(1).optional(),
});

const SUPABASE_REQUIRED_KEYS = [
  'STORAGE_SUPABASE_URL',
  'STORAGE_SUPABASE_SECRET_KEY',
  'STORAGE_SUPABASE_BUCKET_PUBLIC',
  'STORAGE_SUPABASE_BUCKET_PRIVATE',
] as const;

export const refineStorageConfig = (
  value: z.infer<typeof storageSchema>,
  ctx: z.RefinementCtx,
): void => {
  if (value.STORAGE_DRIVER === 'local') {
    if (!value.STORAGE_LOCAL_PATH) {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_LOCAL_PATH'],
        message: 'STORAGE_LOCAL_PATH is required when STORAGE_DRIVER=local',
      });
    }
    if (!value.APP_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['APP_URL'],
        message: 'APP_URL is required when STORAGE_DRIVER=local (used for absolute file URLs)',
      });
    }
    return;
  }

  if (value.STORAGE_DRIVER === 'supabase') {
    for (const key of SUPABASE_REQUIRED_KEYS) {
      if (!value[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required when STORAGE_DRIVER=supabase`,
        });
      }
    }
  }
};

export type StorageConfig = z.infer<typeof storageSchema>;
