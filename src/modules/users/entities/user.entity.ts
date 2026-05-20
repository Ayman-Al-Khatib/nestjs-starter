import { BaseAccountEntity } from 'domain/entities/base-account.entity';
import { Gender } from 'domain/enums/gender.enum';
import { Role } from 'domain/enums/role.enum';
import { CityEntity } from 'modules/cities/entities/city.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity extends BaseAccountEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
  lastName: string | null;

  @Column({
    type: 'enum',
    enum: Gender,
    enumName: 'gender_enum',
    nullable: true,
  })
  gender: Gender | null;

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate: Date | null;

  @Index()
  @Column({ type: 'int', nullable: true, name: 'city_id' })
  cityId: number | null;

  @ManyToOne(() => CityEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'photo_key' })
  photoKey: string | null;

  @Index()
  @Column({ type: 'boolean', default: false, name: 'is_profile_completed' })
  isProfileCompleted: boolean;

  override get role(): Role {
    return Role.USER;
  }
}
