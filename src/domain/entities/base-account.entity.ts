import { Role } from 'domain/enums/role.enum';
import {
  Column,
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
   * Soft account gate. The auth guard rejects principals whose account is
   * inactive, so deactivating an account revokes access without deleting the
   * row (and its history). Defaults to active.
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  /**
   * Subclasses MUST decorate their override with `@Expose()` from
   * class-transformer so the role appears in serialized responses —
   * TypeScript disallows decorators on abstract members, so the
   * decorator must live on the concrete override.
   */
  abstract get role(): Role;
}
