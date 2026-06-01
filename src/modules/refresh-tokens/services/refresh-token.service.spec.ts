import { UnauthorizedException } from '@nestjs/common';
import { Role } from 'domain/enums/role.enum';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Focused coverage of the rotation state machine — the security-critical path
 * (reuse detection, expiry, atomic single-winner rotation).
 */
describe('RefreshTokenService.rotate', () => {
  let repo: {
    findByToken: jest.Mock;
    revokeAllForUser: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let manager: { create: jest.Mock; save: jest.Mock; update: jest.Mock };
  let service: RefreshTokenService;

  const activeRow = () => ({
    id: '1',
    userId: 5,
    role: Role.USER,
    revokedAt: null,
    replacedById: null,
    expiresAt: new Date(Date.now() + 60_000),
  });

  beforeEach(() => {
    repo = {
      findByToken: jest.fn(),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    };
    manager = {
      create: jest.fn().mockReturnValue({ tokenHash: 'h' }),
      save: jest.fn().mockResolvedValue({ id: '2' }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation((cb: (m: typeof manager) => unknown) => cb(manager)),
    };
    const config = { getOrThrow: jest.fn().mockReturnValue(2_592_000) };
    const translator = { tr: jest.fn().mockReturnValue('invalid token') };

    service = new RefreshTokenService(
      repo as never,
      config as never,
      translator as never,
      dataSource as never,
    );
  });

  it('treats reuse of an already-rotated token as theft and revokes all sessions', async () => {
    repo.findByToken.mockResolvedValue({
      ...activeRow(),
      revokedAt: new Date(),
      replacedById: '2',
    });

    await expect(service.rotate('stolen')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repo.revokeAllForUser).toHaveBeenCalledWith(5, Role.USER, expect.any(Date));
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects an expired token without rotating', async () => {
    repo.findByToken.mockResolvedValue({ ...activeRow(), expiresAt: new Date(Date.now() - 1) });

    await expect(service.rotate('old')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects an unknown token', async () => {
    repo.findByToken.mockResolvedValue(null);

    await expect(service.rotate('nope')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates a valid token: issues a new one and conditionally revokes the old row', async () => {
    repo.findByToken.mockResolvedValue(activeRow());

    const result = await service.rotate('valid');

    expect(result.userId).toBe(5);
    expect(result.role).toBe(Role.USER);
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: '1' }),
      expect.objectContaining({ replacedById: '2' }),
    );
  });

  it('throws when a concurrent request already rotated the row (no rows affected)', async () => {
    repo.findByToken.mockResolvedValue(activeRow());
    manager.update.mockResolvedValue({ affected: 0 });

    await expect(service.rotate('valid')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
