import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'domain/enums/role.enum';
import { BaseAccountEntity } from 'domain/entities/base-account.entity';
import { CacheService } from 'infrastructure/cache';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';
import { DecodedAccessTokenPayload } from 'infrastructure/jwt/interfaces';
import { UserResolverRegistry } from 'core/auth/user-resolver.registry';
import { IS_PUBLIC_KEY } from 'core/decorators/public.decorator';
import { ROLES_KEY } from 'core/decorators/protected.decorator';
import { createExecutionContext, createTranslatorMock } from 'test-utils/test-helpers';
import { JwtAuthGuard } from './jwt-auth.guard';

function activeUser(over: Partial<BaseAccountEntity> = {}): BaseAccountEntity {
  return { id: 1, isActive: true, ...over } as BaseAccountEntity;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let jwtService: { verifyAccessToken: jest.Mock };
  let resolverRegistry: { get: jest.Mock };
  let cacheService: { getOrSet: jest.Mock };
  let resolver: { findByIdForAuth: jest.Mock };
  const translator = createTranslatorMock();

  const validPayload: DecodedAccessTokenPayload = {
    userId: 1,
    role: Role.ADMIN,
  } as DecodedAccessTokenPayload;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    jwtService = { verifyAccessToken: jest.fn().mockReturnValue(validPayload) };
    resolver = { findByIdForAuth: jest.fn().mockResolvedValue(activeUser()) };
    resolverRegistry = { get: jest.fn().mockReturnValue(resolver) };
    cacheService = {
      getOrSet: jest.fn((_key: string, factory: () => Promise<unknown>) => factory()),
    };
    (translator.tr as jest.Mock).mockClear();

    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      jwtService as unknown as AppJwtService,
      resolverRegistry as unknown as UserResolverRegistry,
      translator,
      cacheService as unknown as CacheService,
    );
  });

  function reflectorReturns({ isPublic = false, roles }: { isPublic?: boolean; roles?: Role[] }) {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      if (key === ROLES_KEY) return roles;
      return undefined;
    });
  }

  function contextWithAuth(header?: string) {
    return createExecutionContext({
      request: { headers: header ? { authorization: header } : {} },
    });
  }

  it('allows public routes without inspecting the token', async () => {
    reflectorReturns({ isPublic: true });
    const ctx = contextWithAuth();

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects a request with no Authorization header', async () => {
    reflectorReturns({});
    await expect(guard.canActivate(contextWithAuth())).rejects.toThrow(UnauthorizedException);
    expect(translator.tr).toHaveBeenCalledWith('auth.errors.missing_token');
  });

  it('rejects a non-Bearer scheme', async () => {
    reflectorReturns({});
    await expect(
      guard.canActivate(contextWithAuth('Basic abc')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when token verification throws', async () => {
    reflectorReturns({});
    jwtService.verifyAccessToken.mockImplementation(() => {
      throw new Error('bad sig');
    });
    await expect(
      guard.canActivate(contextWithAuth('Bearer x')),
    ).rejects.toThrow(UnauthorizedException);
    expect(translator.tr).toHaveBeenCalledWith('auth.errors.invalid_token');
  });

  it('rejects a token whose role is outside the Role enum', async () => {
    reflectorReturns({});
    jwtService.verifyAccessToken.mockReturnValue({ userId: 1, role: 'superuser' });
    await expect(
      guard.canActivate(contextWithAuth('Bearer x')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('forbids a valid token whose role is not in the required set', async () => {
    reflectorReturns({ roles: [Role.USER] });
    await expect(
      guard.canActivate(contextWithAuth('Bearer x')),
    ).rejects.toThrow(ForbiddenException);
    expect(translator.tr).toHaveBeenCalledWith('auth.errors.forbidden_role');
  });

  it('throws 500 when no resolver is registered for the role', async () => {
    reflectorReturns({ roles: [Role.ADMIN] });
    resolverRegistry.get.mockReturnValue(undefined);
    await expect(
      guard.canActivate(contextWithAuth('Bearer x')),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('rejects when the principal cannot be found', async () => {
    reflectorReturns({ roles: [Role.ADMIN] });
    cacheService.getOrSet.mockResolvedValue(null);
    await expect(
      guard.canActivate(contextWithAuth('Bearer x')),
    ).rejects.toThrow(UnauthorizedException);
    expect(translator.tr).toHaveBeenCalledWith('auth.errors.account_not_found');
  });

  it('rejects a disabled (inactive) account', async () => {
    reflectorReturns({ roles: [Role.ADMIN] });
    cacheService.getOrSet.mockResolvedValue(activeUser({ isActive: false }));
    await expect(
      guard.canActivate(contextWithAuth('Bearer x')),
    ).rejects.toThrow(UnauthorizedException);
    expect(translator.tr).toHaveBeenCalledWith('auth.errors.account_disabled');
  });

  it('passes and attaches the principal on a valid request', async () => {
    reflectorReturns({ roles: [Role.ADMIN] });
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer x' } };
    const ctx = createExecutionContext({ request });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual(activeUser());
    expect(cacheService.getOrSet).toHaveBeenCalledWith(
      'auth:user:admin:1',
      expect.any(Function),
      expect.any(Number),
    );
  });

  it('allows any authenticated role when no role restriction is declared', async () => {
    reflectorReturns({ roles: undefined });
    await expect(
      guard.canActivate(contextWithAuth('Bearer x')),
    ).resolves.toBe(true);
  });
});
