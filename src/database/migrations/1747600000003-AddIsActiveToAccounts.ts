import { MigrationInterface, QueryRunner } from 'typeorm';
import { scopeToConnectionSchema } from 'infrastructure/database/migration-utils';

/**
 * Adds the soft account gate (`is_active`) to every authenticatable table.
 * Existing rows default to active so no one is locked out by the upgrade.
 */
export class AddIsActiveToAccounts1747600000003 implements MigrationInterface {
  name = 'AddIsActiveToAccounts1747600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await scopeToConnectionSchema(queryRunner);

    await queryRunner.query(
      `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await scopeToConnectionSchema(queryRunner);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "is_active"`);
  }
}
