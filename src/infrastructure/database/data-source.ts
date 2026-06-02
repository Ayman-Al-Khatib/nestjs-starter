/**
 * The single TypeORM DataSource the CLI uses for every migration command
 * (generate / run / revert / show) — in development through ts-node, and in
 * production through the compiled `dist/.../data-source.js`. Not consumed at
 * runtime by the Nest app — see `app-database.module.ts` for that.
 */
process.env.TZ = 'UTC';

import { DataSource } from 'typeorm';
import { environmentSchema } from '../config';
import { ENV_FILES, Environment } from '../config/env.constant';
import { buildDataSourceOptions } from './app-database.options';

const env = (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT;

// Dev only (running the .ts via ts-node): resolve path aliases for the .ts
// entities/migrations this DataSource globs in, and read the dotenv file. The
// compiled .js used in production gets its config from the platform-injected
// process.env and must NOT require these devDependencies — they are absent
// under `npm ci --omit=dev`.
if (__filename.endsWith('.ts')) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('tsconfig-paths/register');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require('dotenv') as typeof import('dotenv')).config({ path: `env/${ENV_FILES[env]}` });
}

const config = environmentSchema.parse(process.env);

export const AppDataSource = new DataSource(buildDataSourceOptions({ env, config }));
