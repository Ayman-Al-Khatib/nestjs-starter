/**
 * Connection-pool and startup tuning for the application database.
 * Centralized so values can be reviewed without hunting through the options builder.
 */
export const DATABASE_POOL = {
  MAX_CONNECTIONS: 10,
  MIN_CONNECTIONS: 1,
  IDLE_TIMEOUT_MS: 30_000,
  CONNECTION_TIMEOUT_MS: 5_000,
  KEEP_ALIVE_INITIAL_DELAY_MS: 10_000,
} as const;

export const DATABASE_STARTUP = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5_000,
} as const;

export const DATABASE_TIMEZONE = 'UTC';

export const DATABASE_MIGRATIONS_TABLE = 'migrations';
