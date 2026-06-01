import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from 'domain/enums/role.enum';
import { EnvironmentConfig } from 'infrastructure/config';
import { Translator } from 'infrastructure/i18n';
import { generateOpaqueToken, sha256 } from 'shared/utils';
import { DataSource, IsNull } from 'typeorm';
import { RefreshTokenIssueResult } from '../dto/refresh-token-issue.dto';
import { RefreshTokenRotateResult } from '../dto/refresh-token-rotate-result.dto';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

/**
 * Central refresh-token authority. Tokens are opaque, cryptographically
 * random strings; only the SHA-256 hash is persisted. Callers (Admin /
 * User auth services) never see the storage layer.
 *
 * Security model:
 *  - Rotation: every successful refresh issues a NEW token and revokes
 *    the old one atomically inside a transaction.
 *  - Reuse detection: presenting an already-rotated token (revokedAt
 *    set AND replacedById set) is treated as theft → all of that
 *    user's refresh tokens are revoked.
 *  - Revocation: logout calls `revokeAllForUser` so every active
 *    session for the principal dies.
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly ttlSeconds: number;

  constructor(
    private readonly repo: RefreshTokenRepository,
    private readonly config: ConfigService<EnvironmentConfig>,
    private readonly translator: Translator,
    private readonly dataSource: DataSource,
  ) {
    this.ttlSeconds = this.config.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN_SECONDS');
  }

  async issue(userId: number, role: Role): Promise<RefreshTokenIssueResult> {
    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    const row = this.repo.create({
      tokenHash: sha256(token),
      userId,
      role,
      expiresAt,
    });
    await this.repo.save(row);

    return { token, expiresAt };
  }

  /**
   * Validates an incoming refresh token and rotates it atomically.
   * The insert of the new token and the revocation of the old one
   * happen inside a single transaction — no orphaned tokens on failure.
   */
  async rotate(presentedToken: string): Promise<RefreshTokenRotateResult> {
    const row = await this.lookup(presentedToken);

    // Reuse-after-rotation → suspected theft, scorched earth.
    if (row.revokedAt && row.replacedById) {
      this.logger.warn(
        `Refresh token reuse detected for userId=${row.userId} role=${row.role}; revoking all sessions`,
      );
      await this.repo.revokeAllForUser(row.userId, row.role, new Date());
      throw this.invalid();
    }

    if (row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
      throw this.invalid();
    }

    const newToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);
    const now = new Date();

    // Atomic: insert new token row + revoke old row in one transaction.
    // The revoke is conditional on the old row still being active — if two
    // requests present the same token concurrently, only the one whose
    // UPDATE matches `revokedAt IS NULL` wins; the loser's whole transaction
    // (including its freshly inserted row) rolls back. Without this guard
    // both would mint a valid token from a single one (double-spend).
    await this.dataSource.transaction(async (manager) => {
      const newRow = manager.create(RefreshTokenEntity, {
        tokenHash: sha256(newToken),
        userId: row.userId,
        role: row.role,
        expiresAt,
      });
      const saved = await manager.save(newRow);

      const result = await manager.update(
        RefreshTokenEntity,
        { id: row.id, revokedAt: IsNull() },
        {
          revokedAt: now,
          replacedById: saved.id,
          lastUsedAt: now,
        },
      );

      if (result.affected !== 1) {
        throw this.invalid();
      }
    });

    return { token: newToken, expiresAt, userId: row.userId, role: row.role };
  }

  async revoke(presentedToken: string): Promise<void> {
    const row = await this.repo.findByToken(presentedToken);
    if (!row || row.revokedAt) return;
    await this.repo.revoke(row.id, new Date());
  }

  revokeAllForUser(userId: number, role: Role): Promise<void> {
    return this.repo.revokeAllForUser(userId, role, new Date());
  }

  private async lookup(presentedToken: string): Promise<RefreshTokenEntity> {
    if (typeof presentedToken !== 'string' || presentedToken.length === 0) {
      throw this.invalid();
    }
    const row = await this.repo.findByToken(presentedToken);
    if (!row) {
      throw this.invalid();
    }
    return row;
  }

  private invalid(): UnauthorizedException {
    return new UnauthorizedException(this.translator.tr('auth.errors.invalid_token'));
  }
}
