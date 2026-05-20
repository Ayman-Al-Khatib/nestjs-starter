import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * City lookup table. Each city has unique English and Arabic names.
 * Can be managed by admins. Other tables (areas, users) FK into
 * this row by id.
 */

@Index('uq_cities_name_en', ['nameEn'], { unique: true })
@Index('uq_cities_name_ar', ['nameAr'], { unique: true })
@Entity({ name: 'cities' })
export class CityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128, name: 'name_en' })
  nameEn: string;

  @Column({ type: 'varchar', length: 128, name: 'name_ar' })
  nameAr: string;
}
