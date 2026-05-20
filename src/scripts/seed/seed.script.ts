process.env.TZ = 'UTC';

import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../app.module';
import { DatabaseCleaner } from './database-cleaner';
import { resolveEnvironment } from './seed.constants';
import { SeedRunner } from './seed-runner';

async function bootstrap(): Promise<void> {
  const environment = resolveEnvironment();
  console.log(`🚀 Starting seed pipeline in "${environment}" mode`);

  const app: INestApplicationContext = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
  });

  try {
    await new DatabaseCleaner(app, environment).clear();
    await new SeedRunner(app, environment).run();
    console.log('🎉 Seed pipeline completed successfully');
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed pipeline failed:', error instanceof Error ? error.stack : error);
    process.exit(1);
  });
