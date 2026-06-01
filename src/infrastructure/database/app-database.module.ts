import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Environment } from '../config/env.constant';
import { EnvironmentConfig } from '../config/env.schema';
import { DatabaseConfig } from '../config/schemas';
import { ensureDatabaseAndSchemaExist, ensureSchemaExists } from './app-database.bootstrap';
import { buildSslOptions, buildTypeOrmModuleOptions } from './app-database.options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmModuleOptions,
    }),
  ],
})
export class AppDatabaseModule {}

async function createTypeOrmModuleOptions(
  configService: ConfigService<EnvironmentConfig>,
): Promise<TypeOrmModuleOptions> {
  const env = configService.getOrThrow<Environment>('NODE_ENV');
  const config = readDatabaseConfig(configService);

  if (env === Environment.DEVELOPMENT) {
    await ensureDatabaseAndSchemaExist(config);
  } else {
    // The database is provisioned out-of-band, but the target schema may not
    // exist yet. Create it before TypeORM connects with migrationsRun — it
    // writes its migrations table into this schema and fails if it's missing.
    await ensureSchemaExists(config, buildSslOptions(env, config));
  }

  return buildTypeOrmModuleOptions({ env, config });
}

function readDatabaseConfig(
  configService: ConfigService<EnvironmentConfig>,
): DatabaseConfig {
  return {
    DB_HOST: configService.getOrThrow<string>('DB_HOST'),
    DB_PORT: configService.getOrThrow<number>('DB_PORT'),
    DB_USER: configService.getOrThrow<string>('DB_USER'),
    DB_PASSWORD: configService.getOrThrow<string>('DB_PASSWORD'),
    DB_NAME: configService.getOrThrow<string>('DB_NAME'),
    DB_SCHEMA: configService.getOrThrow<string>('DB_SCHEMA'),
    DB_SSL_REJECT_UNAUTHORIZED: configService.getOrThrow<boolean>('DB_SSL_REJECT_UNAUTHORIZED'),
    DB_SSL_CA: configService.get<string>('DB_SSL_CA'),
  };
}
