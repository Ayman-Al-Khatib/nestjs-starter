import { MigrationInterface, QueryRunner } from 'typeorm';
import { scopeToConnectionSchema } from 'infrastructure/database/migration-utils';

export class Init1747600000001 implements MigrationInterface {
  name = 'Init1747600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await scopeToConnectionSchema(queryRunner);

    // ---------- Enums ----------
    await queryRunner.query(`CREATE TYPE "gender_enum" AS ENUM('male', 'female')`);
    await queryRunner.query(`CREATE TYPE "otp_purpose_enum" AS ENUM('user_login')`);

    // ---------- admins ----------
    await queryRunner.query(`
      CREATE TABLE "admins" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "password" character varying NOT NULL,
        "password_changed_at" TIMESTAMP WITH TIME ZONE,
        "username" character varying(64) NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "phone" character varying(20),
        "photo_key" character varying(512),
        CONSTRAINT "PK_admins" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_admins_username" ON "admins" ("username")`,
    );

    // ---------- cities ----------
    await queryRunner.query(`
      CREATE TABLE "cities" (
        "id" SERIAL NOT NULL,
        "name_en" character varying(128) NOT NULL,
        "name_ar" character varying(128) NOT NULL,
        CONSTRAINT "PK_cities" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_cities_name_en" ON "cities" ("name_en")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_cities_name_ar" ON "cities" ("name_ar")`,
    );

    // ---------- areas ----------
    await queryRunner.query(`
      CREATE TABLE "areas" (
        "id" SERIAL NOT NULL,
        "city_id" integer NOT NULL,
        "name_en" character varying(128) NOT NULL,
        "name_ar" character varying(128) NOT NULL,
        CONSTRAINT "PK_areas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_areas_city_id" ON "areas" ("city_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_areas_city_id_name_en" ON "areas" ("city_id", "name_en")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_areas_city_id_name_ar" ON "areas" ("city_id", "name_ar")`,
    );
    await queryRunner.query(`
      ALTER TABLE "areas"
      ADD CONSTRAINT "FK_areas_city_id"
      FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE
    `);

    // ---------- users ----------
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "phone" character varying(20) NOT NULL,
        "first_name" character varying(100),
        "last_name" character varying(100),
        "gender" "gender_enum",
        "birth_date" date,
        "city_id" integer,
        "address" character varying(512),
        "photo_key" character varying(512),
        "is_profile_completed" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_phone" ON "users" ("phone")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_city_id" ON "users" ("city_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_is_profile_completed" ON "users" ("is_profile_completed")`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_city_id"
      FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT
    `);

    // ---------- otps ----------
    await queryRunner.query(`
      CREATE TABLE "otps" (
        "id" BIGSERIAL NOT NULL,
        "phone" character varying(32) NOT NULL,
        "code_hash" character varying(128) NOT NULL,
        "purpose" "otp_purpose_enum" NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "consumed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_otps" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_otps_phone_purpose_expires_at" ON "otps" ("phone", "purpose", "expires_at")`,
    );

    // ---------- refresh_tokens ----------
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" BIGSERIAL NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "user_id" integer NOT NULL,
        "role" character varying(16) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "replaced_by_id" bigint,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_refresh_token_hash" ON "refresh_tokens" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_id_role" ON "refresh_tokens" ("user_id", "role")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await scopeToConnectionSchema(queryRunner);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_user_id_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_token_hash"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otps_phone_purpose_expires_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otps"`);

    await queryRunner.query(`ALTER TABLE IF EXISTS "users" DROP CONSTRAINT IF EXISTS "FK_users_city_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_profile_completed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_city_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_phone"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`ALTER TABLE IF EXISTS "areas" DROP CONSTRAINT IF EXISTS "FK_areas_city_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_areas_city_id_name_ar"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_areas_city_id_name_en"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_areas_city_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "areas"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "uq_cities_name_ar"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_cities_name_en"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cities"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admins_username"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "otp_purpose_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "gender_enum"`);
  }
}
