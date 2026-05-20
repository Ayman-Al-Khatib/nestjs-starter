import { Inject, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { LOCAL_STORAGE_SIGNING_SECRET } from './local.tokens';

@Injectable()
export class LocalSigningService {
  constructor(@Inject(LOCAL_STORAGE_SIGNING_SECRET) private readonly secret: string) {}

  sign(key: string, expiresAt: number): string {
    return this.compute(key, expiresAt);
  }

  verify(key: string, expiresAt: number, token: string): boolean {
    if (!Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) {
      return false;
    }
    const expected = this.compute(key, expiresAt);
    if (expected.length !== token.length) return false;
    try {
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
    } catch {
      return false;
    }
  }

  private compute(key: string, expiresAt: number): string {
    return createHmac('sha256', this.secret).update(`${key}|${expiresAt}`).digest('hex');
  }
}
