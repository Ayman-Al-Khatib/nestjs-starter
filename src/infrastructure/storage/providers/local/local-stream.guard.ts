import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Visibility } from '../../core/enums/visibility.enum';
import { LocalSigningService } from './local-signing.service';

@Injectable()
export class LocalStreamGuard implements CanActivate {
  constructor(private readonly signing: LocalSigningService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const params = (req.params ?? {}) as { path?: string | string[] };
    const segments = params.path;
    const rawKey = Array.isArray(segments) ? segments.join('/') : String(segments ?? '');
    if (!rawKey) return false;

    const key = `${Visibility.PRIVATE}/${rawKey}`;
    const token = String(req.query.token ?? '');
    const exp = Number(req.query.exp);

    if (!token || !Number.isFinite(exp)) return false;
    return this.signing.verify(key, exp, token);
  }
}
