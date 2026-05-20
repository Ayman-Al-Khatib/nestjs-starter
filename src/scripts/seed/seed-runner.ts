import { INestApplicationContext } from '@nestjs/common';

import { SEED_PIPELINE } from './seed-registry';
import { AppEnvironment, SeedStep } from './seed.types';

export class SeedRunner {
  constructor(
    private readonly app: INestApplicationContext,
    private readonly environment: AppEnvironment,
    private readonly pipeline: ReadonlyArray<SeedStep> = SEED_PIPELINE,
  ) {}

  async run(): Promise<void> {
    const steps = this.pipeline.filter((step) => this.shouldRun(step));
    console.log(`▶ Running ${steps.length} seed step(s) for "${this.environment}"`);

    for (const step of steps) {
      console.log(`  → ${step.name}`);
      await step.run(this.app);
    }

    console.log(`✅ Completed ${steps.length} seed step(s)`);
  }

  private shouldRun(step: SeedStep): boolean {
    return step.runsIn.includes('all') || step.runsIn.includes(this.environment);
  }
}
