import { Client, ClientConfig } from 'pg';
import { DatabaseConfig } from '../config/schemas';

type SslConfig = ClientConfig['ssl'];

/**
 * Local-development convenience: create the target database and schema if they
 * don't exist yet, so a fresh Postgres instance "just works" on first run.
 *
 * Creating the database requires CREATE DATABASE rights, which the cluster user
 * on managed Postgres typically lacks — so this whole helper is dev-only.
 * Production provisions the database out-of-band and uses `ensureSchemaExists`
 * for the schema alone.
 */
export async function ensureDatabaseAndSchemaExist(
  config: DatabaseConfig,
  ssl: SslConfig = false,
): Promise<void> {
  await ensureDatabaseExists(config, ssl);
  await ensureSchemaExists(config, ssl);
}

async function ensureDatabaseExists(config: DatabaseConfig, ssl: SslConfig): Promise<void> {
  const client = new Client({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: 'postgres',
    ssl,
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

/**
 * Creates the configured schema if it does not already exist. Safe to run in
 * any environment — managed Postgres users have CREATE on their own database
 * even when they cannot CREATE DATABASE. Must run before TypeORM connects with
 * `migrationsRun`, since TypeORM writes its migrations table into this schema
 * and fails if the schema is missing.
 */
export async function ensureSchemaExists(
  config: DatabaseConfig,
  ssl: SslConfig = false,
): Promise<void> {
  const client = new Client({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    ssl,
  });

  await client.connect();
  try {
    // pg has no parameterized DDL; identifier is operator-controlled (zod-validated env).
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(config.DB_SCHEMA)}`);
  } catch (error) {
    // Managed Postgres roles sometimes lack CREATE on the database even when the
    // schema was provisioned out-of-band. Treat that as a no-op when the schema
    // already exists — only a genuinely missing schema is fatal.
    const exists = await schemaExists(client, config.DB_SCHEMA);
    if (!exists) {
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function schemaExists(client: Client, schema: string): Promise<boolean> {
  const { rowCount } = await client.query(
    'SELECT 1 FROM information_schema.schemata WHERE schema_name = $1',
    [schema],
  );
  return (rowCount ?? 0) > 0;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}
