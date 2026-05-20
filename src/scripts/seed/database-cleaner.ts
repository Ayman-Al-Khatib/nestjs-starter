import { INestApplicationContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { PRODUCTION_ENV, TRUNCATABLE_TABLES } from './seed.constants';
import { AppEnvironment } from './seed.types';

export class DatabaseCleaner {
  constructor(
    private readonly app: INestApplicationContext,
    private readonly environment: AppEnvironment,
  ) {}

  async clear(): Promise<void> {
    if (this.environment === PRODUCTION_ENV) {
      console.log('⚠️  Production mode: skipping database clear for safety');
      return;
    }

    const dataSource = this.app.get(DataSource);
    const schema = (dataSource.options as PostgresConnectionOptions).schema ?? 'public';
    const tables = TRUNCATABLE_TABLES.map((table) => `"${schema}"."${table}"`).join(', ');

    console.log(`🧹 Truncating ${TRUNCATABLE_TABLES.length} tables in schema "${schema}"`);
    await dataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
    console.log('✅ Database cleared');
  }
}
