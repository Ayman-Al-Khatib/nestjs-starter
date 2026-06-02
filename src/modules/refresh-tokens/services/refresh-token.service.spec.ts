import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from 'domain/enums/role.enum';
import { sha256 } from 'shared/utils';
import { DataSource } from 'typeorm';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshTokenService } from './refresh-token.service';

const TTL_SECONDS = 604_800;

function buildRow(over: Partial<RefreshTokenEntity> = {}): RefreshTokenEntity {
  return {
    id: '10',
    tokenHash: sha256('presented'),
    userId: 1,
    role: Role.USER,
    expiresAt: new Date(Date.now() + TTL_SECONDS * 1000),
    revokedAt: null,
    replacedById: null,
    lastUsedAt: null,
    createdAt: new Date(),
    ...over,
  };
}

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let repo: jest.Mocked<
    Pick<
      RefreshTokenRepository,
      'create' | 'save' | 'findByToken' | 'revoke' | 'revokeAllForUser' | 'deleteExpiredBefore'
    >
  >;
  let manager: { create: jest.Mock; save: jest.Mock; update: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  const translator = createTranslatorMock();

  beforeEach(() => {
    repo = {
      create: jest.fn((data) => data as RefreshTokenEntity),
      save: jest.fn((row) => Promise.resolve(row as RefreshTokenEntity)),
      findByToken: jest.fn(),
      revoke: jest.fn().mockResolvedValue(undefined),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
      deleteExpiredBefore: jest.fn().mockResolvedValue(0),
    };
    manager = {
      create: jest.fn((_entity, data) => data),
      save: jest.fn().mockResolvedValue({ id: 'new-id' }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = {
      transaction: jest.fn(
        (cb: (m: typeof manager) => Promise<unknown>) => cb(manager),
      ),
    };
    const config = {
      getOrThrow: jest.fn(() => TTL_SECONDS),
    } as unknown as ConfigService;

    service = new RefreshTokenService(
      repo as unknown as RefreshTokenRepository,
      config,
      translator,
      dataSource as unknown as DataSource,
    );
  });

  describe('issue', () => {
    it('persists only the SHA-256 hash and returns the plaintext token once', async () => {
      const result = await service.issue(42, Role.ADMIN);

      expect(result.token).toMatch(/^[A-Za-z0-9_-]{64}$/);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenHash: sha256(result.token),
          userId: 42,
          role: Role.ADMIN,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('rotate', () => {
    it('rotates an active token atomically and returns a new token', async () => {
      const row = buildRow();
      repo.findByToken.mockResolvedValue(row);

      const result = await service.rotate('presented');

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      // New row inserted, old row revoked conditionally on revokedAt IS NULL.
      expect(manager.save).toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalledWith(
        RefreshTokenEntity,
        expect.objectContaining({ id: row.id }),
        expect.objectContaining({ replacedById: 'new-id' }),
      );
      expect(result.token).toMatch(/^[A-Za-z0-9_-]{64}$/);
      expect(result.userId).toBe(1);
      expect(result.role).toBe(Role.USER);
    });

    it('treats reuse of an already-rotated token as theft and revokes all sessions', async () => {
      const row = buildRow({ revokedAt: new Date(), replacedById: '99' });
      repo.findByToken.mockResolvedValue(row);

      await expect(service.rotate('presented')).rejects.toThrow(UnauthorizedException);
      expect(repo.revokeAllForUser).toHaveBeenCalledWith(1, Role.USER, expect.any(Date));
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejects a revoked-but-not-rotated token without scorched earth', async () => {
      repo.findByToken.mockResolvedValue(buildRow({ revokedAt: new Date(), replacedById: null }));
      await expect(service.rotate('presented')).rejects.toThrow(UnauthorizedException);
      expect(repo.revokeAllForUser).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      repo.findByToken.mockResolvedValue(buildRow({ expiresAt: new Date(Date.now() - 1000) }));
      await expect(service.rotate('presented')).rejects.toThrow(UnauthorizedException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejects when the conditional revoke loses a concurrent race (affected !== 1)', async () => {
      repo.findByToken.mockResolvedValue(buildRow());
      manager.update.mockResolvedValue({ affected: 0 });
      await expect(service.rotate('presented')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an empty / non-string presented token', async () => {
      await expect(service.rotate('')).rejects.toThrow(UnauthorizedException);
      await expect(service.rotate(undefined as unknown as string)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repo.findByToken).not.toHaveBeenCalled();
    });

    it('rejects an unknown token', async () => {
      repo.findByToken.mockResolvedValue(null);
      await expect(service.rotate('presented')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revoke', () => {
    it('revokes the single presented session when active', async () => {
      const row = buildRow();
      repo.findByToken.mockResolvedValue(row);
      await service.revoke('presented');
      expect(repo.revoke).toHaveBeenCalledWith(row.id, expect.any(Date));
    });

    it('is a no-op for an unknown token', async () => {
      repo.findByToken.mockResolvedValue(null);
      await service.revoke('presented');
      expect(repo.revoke).not.toHaveBeenCalled();
    });

    it('is a no-op for an already-revoked token', async () => {
      repo.findByToken.mockResolvedValue(buildRow({ revokedAt: new Date() }));
      await service.revoke('presented');
      expect(repo.revoke).not.toHaveBeenCalled();
    });
  });

  describe('revokeAllForUser', () => {
    it('delegates to the repository', async () => {
      await service.revokeAllForUser(5, Role.ADMIN);
      expect(repo.revokeAllForUser).toHaveBeenCalledWith(5, Role.ADMIN, expect.any(Date));
    });
  });

  describe('pruneExpiredTokens', () => {
    it('drops rows expired before now', async () => {
      await service.pruneExpiredTokens();
      expect(repo.deleteExpiredBefore).toHaveBeenCalledWith(expect.any(Date));
    });
  });
});
