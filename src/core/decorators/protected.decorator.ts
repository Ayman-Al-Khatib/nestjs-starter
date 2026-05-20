import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from 'domain/enums/role.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/** Reflector key the JwtAuthGuard reads to learn which roles a route allows. */
export const ROLES_KEY = 'roles';

/**
 * Gate a controller (or route handler) behind authentication, optionally
 * restricting to a subset of roles. Stacks `JwtAuthGuard` + a `roles`
 * metadata tag so the guard can reject mismatched roles with a 403.
 *
 * - `@Protected()` — any authenticated principal (no role check).
 * - `@Protected(Role.USER)` — only users.
 * - `@Protected(Role.ADMIN, Role.USER)` — admins OR users.
 */
export function Protected(...roles: Role[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(JwtAuthGuard));
}
