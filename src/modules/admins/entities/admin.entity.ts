import { BasePasswordUserEntity } from 'domain/entities/base-password-user.entity';
import { Role } from 'domain/enums/role.enum';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'admins' })
export class AdminEntity extends BasePasswordUserEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  username: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'photo_key' })
  photoKey: string | null;

  override get role(): Role {
    return Role.ADMIN;
  }
}
