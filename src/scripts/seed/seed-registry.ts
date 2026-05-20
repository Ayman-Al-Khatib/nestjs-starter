import { seedAdmin } from '../../modules/admins/seeders/seed-admin';
import { seedAreas } from '../../modules/areas/seeders/seed-areas';
import { seedCities } from '../../modules/cities/seeders/seed-cities';
import { seedUsers } from '../../modules/users/seeders/seed-users';
import { SeedStep } from './seed.types';

/**
 * Ordered seed pipeline. The order is significant — parents (cities,
 * areas) must be present before children (users).
 */
export const SEED_PIPELINE: ReadonlyArray<SeedStep> = [
  { name: 'cities', runsIn: ['all'], run: seedCities },
  { name: 'areas', runsIn: ['all'], run: seedAreas },
  { name: 'admin', runsIn: ['all'], run: seedAdmin },
  { name: 'users', runsIn: ['development', 'test'], run: seedUsers },
];
