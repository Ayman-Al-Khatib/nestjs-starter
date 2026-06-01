import { QueryRunner } from 'typeorm';

/**
 * Returns the schema name configured on the active connection, or
 * `'public'` when none is set. Used by migrations that need a runtime
 * schema reference (e.g. to scope `search_path` or qualify identifiers).
 */
export function getConnectionSchema(queryRunner: QueryRunner): string {
  const options = queryRunner.connection.options as { schema?: string };
  return options.schema ?? 'public';
}

/**
 * Creates the connection's configured schema when it does not exist.
 *
 * Production databases are provisioned out-of-band and the dev-only
 * `ensureDatabaseAndSchemaExist` bootstrap never runs there, so a fresh
 * deployment can land with the target schema missing. Without this guard
 * the first migration's unqualified `CREATE TABLE` fails with Postgres
 * `3F000: no schema has been selected to create in`. Idempotent, so it is
 * a no-op on environments where the schema already exists.
 */
export async function createSchemaIfNotExists(queryRunner: QueryRunner): Promise<void> {
  const schema = getConnectionSchema(queryRunner);
  await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
}

/**
 * Scopes the current session's `search_path` to the connection's
 * configured schema. After this call, unqualified DDL/DML in the
 * migration resolves to that schema rather than `public`.
 *
 * TypeORM does not update `search_path` for raw `queryRunner.query`
 * calls — only its own generated SQL is schema-qualified. Migrations
 * that issue plain DDL must scope themselves to avoid leaking into
 * the wrong schema.
 */
export async function scopeToConnectionSchema(queryRunner: QueryRunner): Promise<void> {
  const schema = getConnectionSchema(queryRunner);
  await queryRunner.query(`SET LOCAL search_path TO "${schema}"`);
}
