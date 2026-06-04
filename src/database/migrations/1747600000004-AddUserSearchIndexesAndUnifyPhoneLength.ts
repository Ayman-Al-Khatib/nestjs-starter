import { MigrationInterface, QueryRunner } from 'typeorm';
import { getConnectionSchema } from 'infrastructure/database/migration-utils';

/**
 * Two changes:
 *  1. Trigram (pg_trgm GIN) indexes on the columns the admin user-search filters
 *     with `ILIKE '%term%'`. A leading `%` defeats a B-tree, forcing a full scan;
 *     a GIN trigram index makes substring search index-backed as the table grows.
 *  2. Unifies the phone column length to varchar(32) across `users` and `admins`
 *     so every phone-bearing table matches `otps.phone` (already 32). Widening a
 *     varchar is metadata-only — no table rewrite.
 *
 * search_path includes `public` so `gin_trgm_ops` resolves whether pg_trgm was
 * installed into this connection's schema or the cluster-default public schema.
 */
export class AddUserSearchIndexesAndUnifyPhoneLength1747600000004
  implements MigrationInterface
{
  name = 'AddUserSearchIndexesAndUnifyPhoneLength1747600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = getConnectionSchema(queryRunner);
    await queryRunner.query(`SET LOCAL search_path TO "${schema}", public`);

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phone" TYPE character varying(32)`);
    await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "phone" TYPE character varying(32)`);

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_first_name_trgm" ON "users" USING gin ("first_name" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_last_name_trgm" ON "users" USING gin ("last_name" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_phone_trgm" ON "users" USING gin ("phone" gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = getConnectionSchema(queryRunner);
    await queryRunner.query(`SET LOCAL search_path TO "${schema}", public`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_phone_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_last_name_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_first_name_trgm"`);

    await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "phone" TYPE character varying(20)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phone" TYPE character varying(20)`);
  }
}
