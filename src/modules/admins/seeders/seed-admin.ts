import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { AdminEntity } from 'modules/admins/entities/admin.entity';
import { EnvironmentConfig } from 'infrastructure/config/env.schema';

/**
 * Idempotent admin seeder. Reads SEED_ADMIN_* env vars and
 * inserts the row only when no admin with that username exists.
 *
 * Seeders intentionally bypass the AdminService and work directly
 * against the entity repository. Cross-module reach is acceptable
 * here because seeders are bootstrap utilities, not application code.
 */
export async function seedAdmin(app: INestApplicationContext): Promise<void> {
  const logger = new Logger('seedAdmin');
  const config = app.get(ConfigService<EnvironmentConfig>);
  const dataSource = app.get(DataSource);
  const adminRepo = dataSource.getRepository(AdminEntity);

  const username = config.getOrThrow<string>('SEED_ADMIN_USERNAME');

  const existing = await adminRepo.findOne({ where: { username } });
  if (existing) {
    logger.warn(`Seed admin already exists: id=${existing.id} username=${existing.username}`);
    return;
  }

  const admin = adminRepo.create({
    username,
    password: config.getOrThrow<string>('SEED_ADMIN_PASSWORD'),
    firstName: config.getOrThrow<string>('SEED_ADMIN_FIRST_NAME'),
    lastName: config.getOrThrow<string>('SEED_ADMIN_LAST_NAME'),
  });
  // BeforeInsert hook on BasePasswordUserEntity hashes the password.
  const saved = await adminRepo.save(admin);
  logger.debug(`Created seed admin: id=${saved.id} username=${saved.username}`);
}
