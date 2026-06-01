import { comparePassword, hashPassword, isPasswordHashed } from 'shared/utils';
import { BeforeInsert, BeforeUpdate, Column } from 'typeorm';
import { BaseAccountEntity } from './base-account.entity';

/**
 * Base for password-authenticated accounts. OTP-based accounts extend
 * BaseAccountEntity directly and never inherit a password column.
 */
export abstract class BasePasswordUserEntity extends BaseAccountEntity {
  // select:false keeps the hash out of default reads — it never reaches the
  // auth-user cache (Redis) or any accidental entity serialization. The two
  // paths that need it (login, credential change) opt in via addSelect.
  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'password_changed_at' })
  passwordChangedAt: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPasswordOnSave(): Promise<void> {
    if (!this.password || isPasswordHashed(this.password)) return;
    this.password = await hashPassword(this.password.trim());
    this.passwordChangedAt = new Date();
  }

  checkPassword(plainPassword: string): Promise<boolean> {
    return comparePassword(plainPassword, this.password);
  }
}
