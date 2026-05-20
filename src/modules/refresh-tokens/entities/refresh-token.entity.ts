import { Role } from 'domain/enums/role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Opaque refresh-token row. The plaintext token is shown to the client
 * exactly once at issue time; only its SHA-256 hash is stored here.
 *
 * Rotation chain: when a token is exchanged for a new one we set
 * `revokedAt` and `replacedById` on the old row. If a token whose
 * `replacedById` is already set is presented again, that's reuse of an
 * already-rotated token — treated as theft, and the entire user's
 * tokens get revoked.
 */
@Entity({ name: 'refresh_tokens' })
@Index('idx_refresh_token_hash', ['tokenHash'], { unique: true })
@Index(['userId', 'role'])
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 64, name: 'token_hash' })
  tokenHash: string;

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 16 })
  role: Role;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_used_at' })
  lastUsedAt: Date | null;

  /** Set when this token has been rotated; points at the new row's id. */
  @Column({ type: 'bigint', nullable: true, name: 'replaced_by_id' })
  replacedById: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
