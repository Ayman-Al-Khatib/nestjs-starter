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
