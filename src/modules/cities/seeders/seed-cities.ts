import { INestApplicationContext, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { CityEntity } from '../entities/city.entity';

/**
 * Idempotent city seeder. The 14 Syrian governorates are upserted on
 * `id` so the numeric ids are stable (1..14) across reruns and across
 * environments — other seeders reference these ids directly.
 */
const citySeeds: Pick<CityEntity, 'id' | 'nameEn' | 'nameAr'>[] = [
  { id: 1, nameEn: 'Damascus', nameAr: 'دمشق' },
  { id: 2, nameEn: 'Rural Damascus', nameAr: 'ريف دمشق' },
  { id: 3, nameEn: 'Aleppo', nameAr: 'حلب' },
  { id: 4, nameEn: 'Homs', nameAr: 'حمص' },
  { id: 5, nameEn: 'Hama', nameAr: 'حماة' },
  { id: 6, nameEn: 'Latakia', nameAr: 'اللاذقية' },
  { id: 7, nameEn: 'Tartus', nameAr: 'طرطوس' },
  { id: 8, nameEn: 'Idlib', nameAr: 'إدلب' },
  { id: 9, nameEn: 'Daraa', nameAr: 'درعا' },
  { id: 10, nameEn: 'As-Suwayda', nameAr: 'السويداء' },
  { id: 11, nameEn: 'Quneitra', nameAr: 'القنيطرة' },
  { id: 12, nameEn: 'Ar-Raqqah', nameAr: 'الرقة' },
  { id: 13, nameEn: 'Deir ez-Zor', nameAr: 'دير الزور' },
  { id: 14, nameEn: 'Al-Hasakah', nameAr: 'الحسكة' },
];

export async function seedCities(app: INestApplicationContext): Promise<void> {
  const logger = new Logger('seedCities');
  const dataSource = app.get(DataSource);
  const schema = (dataSource.options as PostgresConnectionOptions).schema ?? 'public';

  const values = citySeeds
    .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
    .join(', ');

  await dataSource.query(
    `
    INSERT INTO "${schema}".cities (id, name_en, name_ar)
    VALUES ${values}
    ON CONFLICT (id) DO UPDATE
    SET name_en = EXCLUDED.name_en,
        name_ar = EXCLUDED.name_ar
    `,
    citySeeds.flatMap((c) => [c.id, c.nameEn, c.nameAr]),
  );

  await dataSource.query(
    `SELECT setval(pg_get_serial_sequence('"${schema}".cities', 'id'), (SELECT MAX(id) FROM "${schema}".cities))`,
  );

  logger.debug(`Seeded ${citySeeds.length} cities successfully.`);
}
