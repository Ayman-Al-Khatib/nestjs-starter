import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'domain/enums/role.enum';
import { sha256 } from 'shared/utils';
import { IsNull, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

/**
 * Internal data-access for refresh tokens. Stays scoped to
 * RefreshTokensModule; other modules call RefreshTokenService.
 *
 * Hashing is an internal storage detail — callers always pass the
 * plaintext token and this class handles the hash transparently.
 */
@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  create(data: Partial<RefreshTokenEntity>): RefreshTokenEntity {
    return this.repo.create(data);
  }

  save(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    return this.repo.save(token);
  }

  /** Looks up a row by the plaintext token — hashes internally. */
  findByToken(plainToken: string): Promise<RefreshTokenEntity | null> {
    return this.repo.findOne({ where: { tokenHash: sha256(plainToken) } });
  }

  async markRotated(id: string, replacedById: string, at: Date): Promise<void> {
    await this.repo.update({ id }, { revokedAt: at, replacedById, lastUsedAt: at });
  }

  async revoke(id: string, at: Date): Promise<void> {
    await this.repo.update({ id }, { revokedAt: at });
  }

  async revokeAllForUser(userId: number, role: Role, at: Date): Promise<void> {
    await this.repo.update(
      { userId, role, revokedAt: IsNull() },
      { revokedAt: at },
    );
  }

  /**
   * Hard-deletes rows whose expiry has passed. Expired tokens can no longer be
   * rotated (rotate() rejects them), so removing them only reclaims space and
   * never loses reuse-detection signal for live tokens.
   */
  async deleteExpiredBefore(now: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now })
      .execute();
    return result.affected ?? 0;
  }
}
