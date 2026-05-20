/**
 * Standalone TypeORM DataSource used by the `typeorm` CLI (migration:generate,
 * migration:run, migration:revert). Not consumed at runtime by the Nest app —
 * see `app-database.module.ts` for that.
 */
process.env.TZ = 'UTC';

import 'tsconfig-paths/register';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { environmentSchema } from '../config';
import { ENV_FILES, Environment } from '../config/env.constant';
import { buildDataSourceOptions } from './app-database.options';

const env = (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT;
dotenv.config({ path: `env/${ENV_FILES[env]}` });

const config = environmentSchema.parse(process.env);

export const AppDataSource = new DataSource(buildDataSourceOptions({ env, config }));
