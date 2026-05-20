import { Client } from 'pg';
import { DatabaseConfig } from '../config/schemas';

/**
 * Local-development convenience: create the target database and schema if they
 * don't exist yet, so a fresh Postgres instance "just works" on first run.
 *
 * Must only be called in development — production databases are provisioned
 * out-of-band, and the cluster user used here typically lacks CREATE DATABASE
 * rights against managed Postgres anyway.
 */
export async function ensureDatabaseAndSchemaExist(config: DatabaseConfig): Promise<void> {
  await ensureDatabaseExists(config);
  await ensureSchemaExists(config);
}

async function ensureDatabaseExists(config: DatabaseConfig): Promise<void> {
  const client = new Client({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: 'postgres',
  });

  await client.connect();
  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.DB_NAME],
    );
    if (rowCount === 0) {
      // pg has no parameterized DDL; identifier is operator-controlled (zod-validated env).
      await client.query(`CREATE DATABASE ${quoteIdentifier(config.DB_NAME)}`);
      console.log(`Database "${config.DB_NAME}" created.`);
    }
  } finally {
    await client.end();
  }
}

async function ensureSchemaExists(config: DatabaseConfig): Promise<void> {
  const client = new Client({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
  });

  await client.connect();
  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM information_schema.schemata WHERE schema_name = $1',
      [config.DB_SCHEMA],
    );
    if (rowCount === 0) {
      await client.query(`CREATE SCHEMA ${quoteIdentifier(config.DB_SCHEMA)}`);
      console.log(`Schema "${config.DB_SCHEMA}" created.`);
    }
  } finally {
    await client.end();
  }
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}
