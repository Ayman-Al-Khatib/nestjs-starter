import { AppEnvironment } from './seed.types';

export const PRODUCTION_ENV: AppEnvironment = 'production';

/**
 * Tables truncated before a non-production seed run.
 *
 * Order matters: children before parents so CASCADE never has to
 * reach across an FK that the next entry would have removed first.
 */
export const TRUNCATABLE_TABLES = [
  'users',
  'admins',
  'areas',
] as const;

export function resolveEnvironment(): AppEnvironment {
  const value = process.env.NODE_ENV;
  if (value === 'production' || value === 'test') return value;
  return 'development';
}
