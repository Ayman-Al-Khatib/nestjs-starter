import { INestApplicationContext } from '@nestjs/common';

export type AppEnvironment = 'development' | 'production' | 'test';

export type SeedEnvironment = AppEnvironment | 'all';

export interface SeedStep {
  name: string;
  runsIn: ReadonlyArray<SeedEnvironment>;
  run: (app: INestApplicationContext) => Promise<void>;
}
