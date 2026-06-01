import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { UserResolverRegistry } from 'core/auth/user-resolver.registry';
import { ROLES_KEY } from 'core/decorators/protected.decorator';
import { IS_PUBLIC_KEY } from 'core/decorators/public.decorator';
import { BaseAccountEntity } from 'domain/entities/base-account.entity';
import { Role } from 'domain/enums/role.enum';
import { CacheKeys, CacheService, CacheTtl } from 'infrastructure/cache';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';
import { DecodedAccessTokenPayload } from 'infrastructure/jwt/interfaces';
import { Translator } from 'infrastructure/i18n';

const BEARER_SCHEME = 'Bearer';
const ALLOWED_ROLES: ReadonlySet<string> = new Set(Object.values(Role));

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: AppJwtService,
    private readonly userResolvers: UserResolverRegistry,
    private readonly translator: Translator,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException(this.translator.tr('auth.errors.missing_token'));
    }

    const payload = this.verifyToken(token);
    const role = this.coerceRole(payload.role);
    if (!role) {
      throw new UnauthorizedException(this.translator.tr('auth.errors.invalid_token'));
    }

    this.assertRoleAllowed(context, role);

    const resolver = this.userResolvers.get(role);
    if (!resolver) {
      throw new InternalServerErrorException(
        this.translator.tr('auth.errors.auth_resolver_not_configured'),
      );
    }

    // Read-through cache. Under CACHE_DRIVER=noop this collapses to a
    // plain DB lookup (factory always runs); under redis it saves a
    // round-trip per authenticated request. Cached value is JSON, so
    // prototype methods/getters are absent — request.user readers in
    // this codebase access plain fields only.
    const user = await this.cacheService.getOrSet<BaseAccountEntity>(
      CacheKeys.authUser(role, payload.userId),
      () => resolver.findByIdForAuth(payload.userId),
      CacheTtl.AUTH_USER_SECONDS,
    );
    if (!user) {
      throw new UnauthorizedException(this.translator.tr('auth.errors.account_not_found'));
    }
    if (user.isActive === false) {
      throw new UnauthorizedException(this.translator.tr('auth.errors.account_disabled'));
    }

    request.user = user;
    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }

  private verifyToken(token: string): DecodedAccessTokenPayload {
    try {
      return this.jwtService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException(this.translator.tr('auth.errors.invalid_token'));
    }
  }

  private assertRoleAllowed(context: ExecutionContext, role: Role): void {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles?.length && !requiredRoles.includes(role)) {
      throw new ForbiddenException(this.translator.tr('auth.errors.forbidden_role'));
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;

    const [scheme, token] = header.split(' ');
    return scheme === BEARER_SCHEME && token ? token : undefined;
  }

  private coerceRole(value: unknown): Role | undefined {
    if (typeof value !== 'string') return undefined;
    return ALLOWED_ROLES.has(value) ? (value as Role) : undefined;
  }
}
