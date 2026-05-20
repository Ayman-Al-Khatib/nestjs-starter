import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

import { EnvironmentConfig } from '../config/env.schema';
import { AccessTokenPayload, DecodedAccessTokenPayload } from './interfaces';

/**
 * Signs and verifies access tokens.
 *
 * Refresh tokens are opaque and DB-backed — handled by `RefreshTokenService`,
 * not by this service.
 *
 * Security:
 *  - Algorithm is pinned to HS256 on BOTH sign and verify. Pinning on verify
 *    blocks the classic `alg: none` / RS↔HS confusion attacks.
 *  - `iss` and `aud` claims bind the token to this app. Verification rejects
 *    tokens whose claims don't match.
 */
const JWT_ALGORITHM: jwt.Algorithm = 'HS256';

@Injectable()
export class AppJwtService {
  private readonly accessSecret: string;
  private readonly accessExpiresInSeconds: number;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    this.accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.accessExpiresInSeconds = this.configService.getOrThrow<number>(
      'JWT_ACCESS_EXPIRES_IN_SECONDS',
    );
    this.issuer = this.configService.getOrThrow<string>('JWT_ISSUER');
    this.audience = this.configService.getOrThrow<string>('JWT_AUDIENCE');
  }

  createAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      algorithm: JWT_ALGORITHM,
      expiresIn: this.accessExpiresInSeconds,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  verifyAccessToken(token: string): DecodedAccessTokenPayload {
    try {
      return jwt.verify(token, this.accessSecret, {
        algorithms: [JWT_ALGORITHM],
        issuer: this.issuer,
        audience: this.audience,
      }) as DecodedAccessTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
