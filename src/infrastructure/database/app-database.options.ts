import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import { DataSourceOptions, LoggerOptions } from 'typeorm';
import { Environment } from '../config/env.constant';
import { DatabaseConfig } from '../config/schemas';
import {
  DATABASE_MIGRATIONS_TABLE,
  DATABASE_POOL,
  DATABASE_STARTUP,
  DATABASE_TIMEZONE,
} from './app-database.constants';

const SRC_ROOT = join(__dirname, '..', '..');
const ENTITIES_GLOB = join(SRC_ROOT, '**', '*.entity{.ts,.js}');
const MIGRATIONS_GLOB = join(SRC_ROOT, 'database', 'migrations', '**', '*{.ts,.js}');

export interface DatabaseOptionsInput {
  env: Environment;
  config: DatabaseConfig;
}

/**
 * Options for the standalone TypeORM CLI (migration:generate / run / revert).
 *
 * Auto-sync and auto-run-migrations are off: the CLI manages migration lifecycle
 * explicitly, and turning them on here would either fight or duplicate the command.
 */
export function buildDataSourceOptions({ env, config }: DatabaseOptionsInput): DataSourceOptions {
  return {
    ...buildBaseConnectionOptions(config),
    entities: [ENTITIES_GLOB],
    migrations: [MIGRATIONS_GLOB],
    migrationsTableName: DATABASE_MIGRATIONS_TABLE,
    synchronize: false,
    migrationsRun: false,
    logging: buildLoggingOptions(env),
    ssl: buildSslOptions(env, config),
  };
}

/**
 * Options for the runtime Nest module (TypeOrmModule.forRootAsync).
 *
 * Schema management rules:
 *   - development: synchronize=true   (fast iteration; entity changes hit the DB immediately)
 *   - test / production: synchronize=false, migrationsRun=true — TypeORM applies pending
 *       migrations natively on boot, right after `ensureSchemaExists` has created the target
 *       schema (see app-database.module). Migrations remain runnable from the terminal too via
 *       `migration:run` / `migration:run:prod`, which use the same DataSource.
 *
 * Note (multi-replica): boot-time auto-migrate can have several replicas race the same DDL.
 * When scaling horizontally, run `npm run migration:run:prod` once as a release step before
 * starting the replicas instead of relying on boot.
 */
export function buildTypeOrmModuleOptions({
  env,
  config,
}: DatabaseOptionsInput): TypeOrmModuleOptions {
  const isDevelopment = env === Environment.DEVELOPMENT;

  return {
    ...buildBaseConnectionOptions(config),
    // Entities are registered per-feature via TypeOrmModule.forFeature() and
    // picked up here. No glob needed at runtime.
    autoLoadEntities: true,
    migrations: [MIGRATIONS_GLOB],
    migrationsTableName: DATABASE_MIGRATIONS_TABLE,
    synchronize: isDevelopment,
    migrationsRun: !isDevelopment,
    logging: buildLoggingOptions(env),
    ssl: buildSslOptions(env, config),
    retryAttempts: DATABASE_STARTUP.RETRY_ATTEMPTS,
    retryDelay: DATABASE_STARTUP.RETRY_DELAY_MS,
  };
}

function buildBaseConnectionOptions(config: DatabaseConfig) {
  return {
    type: 'postgres' as const,
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    schema: config.DB_SCHEMA,
    extra: {
      max: DATABASE_POOL.MAX_CONNECTIONS,
      min: DATABASE_POOL.MIN_CONNECTIONS,
      idleTimeoutMillis: DATABASE_POOL.IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: DATABASE_POOL.CONNECTION_TIMEOUT_MS,
      keepAlive: true,
      keepAliveInitialDelayMillis: DATABASE_POOL.KEEP_ALIVE_INITIAL_DELAY_MS,
      timezone: DATABASE_TIMEZONE,
    },
  };
}

function buildLoggingOptions(env: Environment): LoggerOptions {
  return env === Environment.PRODUCTION ? ['error'] : ['error', 'warn', 'migration'];
}

export function buildSslOptions(env: Environment, config: DatabaseConfig) {
  if (env !== Environment.PRODUCTION) {
    return false;
  }
  return {
    rejectUnauthorized: config.DB_SSL_REJECT_UNAUTHORIZED,
    ...(config.DB_SSL_CA ? { ca: config.DB_SSL_CA } : {}),
  };
}
