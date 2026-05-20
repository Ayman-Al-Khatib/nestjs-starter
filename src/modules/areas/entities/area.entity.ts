import { CityEntity } from 'modules/cities/entities/city.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Area lookup table.
 * Each area belongs to a city.
 * Seeded at bootstrap and can be managed by admins.
 * Other tables reference this table by id.
 */

@Index('uq_areas_city_id_name_en', ['cityId', 'nameEn'], { unique: true })
@Index('uq_areas_city_id_name_ar', ['cityId', 'nameAr'], { unique: true })
@Entity({ name: 'areas' })
export class AreaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', name: 'city_id' })
  cityId: number;

  @Column({ type: 'varchar', length: 128, name: 'name_en' })
  nameEn: string;

  @Column({ type: 'varchar', length: 128, name: 'name_ar' })
  nameAr: string;

  @ManyToOne(() => CityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city?: CityEntity;
}
