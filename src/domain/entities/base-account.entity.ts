import { Role } from 'domain/enums/role.enum';
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Shared identity + audit fields for every authenticatable entity.
 * Password lives on BasePasswordUserEntity so OTP-only accounts never
 * inherit a password column.
 */
export abstract class BaseAccountEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  /**
   * Subclasses MUST decorate their override with `@Expose()` from
   * class-transformer so the role appears in serialized responses —
   * TypeScript disallows decorators on abstract members, so the
   * decorator must live on the concrete override.
   */
  abstract get role(): Role;
}
