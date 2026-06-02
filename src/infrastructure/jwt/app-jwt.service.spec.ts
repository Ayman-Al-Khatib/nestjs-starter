import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Role } from 'domain/enums/role.enum';
import { AppJwtService } from './app-jwt.service';

const CONFIG: Record<string, string | number> = {
  JWT_ACCESS_SECRET: 'a'.repeat(48),
  JWT_ACCESS_EXPIRES_IN_SECONDS: 900,
  JWT_ISSUER: 'nest-starter',
  JWT_AUDIENCE: 'nest-starter-clients',
};

function buildService(overrides: Record<string, string | number> = {}): AppJwtService {
  const merged = { ...CONFIG, ...overrides };
  const config = {
    getOrThrow: jest.fn((key: string) => merged[key]),
  } as unknown as ConfigService;
  return new AppJwtService(config);
}

describe('AppJwtService', () => {
  describe('createAccessToken / verifyAccessToken round-trip', () => {
    it('signs a token that verifies back to the same payload', () => {
      const service = buildService();
      const token = service.createAccessToken({ userId: 7, role: Role.ADMIN });

      const decoded = service.verifyAccessToken(token);

      expect(decoded.userId).toBe(7);
      expect(decoded.role).toBe(Role.ADMIN);
      const claims = decoded as unknown as { iss: string; aud: string };
      expect(claims.iss).toBe(CONFIG.JWT_ISSUER);
      expect(claims.aud).toBe(CONFIG.JWT_AUDIENCE);
    });

    it('embeds an expiry derived from JWT_ACCESS_EXPIRES_IN_SECONDS', () => {
      const service = buildService();
      const token = service.createAccessToken({ userId: 1, role: Role.USER });
      const decoded = service.verifyAccessToken(token);
      expect((decoded.exp ?? 0) - (decoded.iat ?? 0)).toBe(900);
    });
  });

  describe('verifyAccessToken rejects forged / mismatched tokens', () => {
    it('rejects a token signed with a different secret', () => {
      const service = buildService();
      const forged = jwt.sign({ userId: 1, role: Role.ADMIN }, 'b'.repeat(48), {
        algorithm: 'HS256',
        issuer: CONFIG.JWT_ISSUER as string,
        audience: CONFIG.JWT_AUDIENCE as string,
      });
      expect(() => service.verifyAccessToken(forged)).toThrow(UnauthorizedException);
    });

    it('rejects a token with the wrong issuer', () => {
      const service = buildService();
      const wrongIssuer = jwt.sign({ userId: 1, role: Role.ADMIN }, CONFIG.JWT_ACCESS_SECRET as string, {
        algorithm: 'HS256',
        issuer: 'evil-issuer',
        audience: CONFIG.JWT_AUDIENCE as string,
      });
      expect(() => service.verifyAccessToken(wrongIssuer)).toThrow(UnauthorizedException);
    });

    it('rejects a token with the wrong audience', () => {
      const service = buildService();
      const wrongAud = jwt.sign({ userId: 1, role: Role.ADMIN }, CONFIG.JWT_ACCESS_SECRET as string, {
        algorithm: 'HS256',
        issuer: CONFIG.JWT_ISSUER as string,
        audience: 'someone-else',
      });
      expect(() => service.verifyAccessToken(wrongAud)).toThrow(UnauthorizedException);
    });

    it('rejects an alg:none / unsigned token (algorithm pinned to HS256)', () => {
      const service = buildService();
      const unsigned = jwt.sign({ userId: 1, role: Role.ADMIN }, '', {
        algorithm: 'none',
        issuer: CONFIG.JWT_ISSUER as string,
        audience: CONFIG.JWT_AUDIENCE as string,
      });
      expect(() => service.verifyAccessToken(unsigned)).toThrow(UnauthorizedException);
    });

    it('rejects an expired token', () => {
      const service = buildService();
      const expired = jwt.sign({ userId: 1, role: Role.ADMIN }, CONFIG.JWT_ACCESS_SECRET as string, {
        algorithm: 'HS256',
        issuer: CONFIG.JWT_ISSUER as string,
        audience: CONFIG.JWT_AUDIENCE as string,
        expiresIn: -10,
      });
      expect(() => service.verifyAccessToken(expired)).toThrow(UnauthorizedException);
    });

    it('rejects a structurally invalid token', () => {
      const service = buildService();
      expect(() => service.verifyAccessToken('not.a.jwt')).toThrow(UnauthorizedException);
    });
  });
});
