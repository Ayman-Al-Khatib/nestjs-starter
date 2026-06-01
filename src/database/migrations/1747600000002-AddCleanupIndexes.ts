import { MigrationInterface, QueryRunner } from 'typeorm';
import { scopeToConnectionSchema } from 'infrastructure/database/migration-utils';

/**
 * Indexes backing the nightly cleanup jobs:
 *   - refresh_tokens(expires_at): prune expired tokens.
 *   - otps(created_at): prune stale OTP rows (also speeds the rolling-window
 *     rate/lock counts that filter on created_at).
 */
export class AddCleanupIndexes1747600000002 implements MigrationInterface {
  name = 'AddCleanupIndexes1747600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await scopeToConnectionSchema(queryRunner);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_otps_created_at" ON "otps" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await scopeToConnectionSchema(queryRunner);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otps_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_expires_at"`);
  }
}
