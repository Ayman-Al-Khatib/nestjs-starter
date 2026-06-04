import { SetMetadata } from '@nestjs/common';
import { Role } from 'domain/enums/role.enum';

/** Reflector key the JwtAuthGuard reads to learn which roles a route allows. */
export const ROLES_KEY = 'roles';

/**
 * Restrict a controller (or route handler) to a subset of roles. The global
 * `JwtAuthGuard` already enforces authentication on every non-`@Public()`
 * route; this decorator only layers the allowed-roles tag on top, so the guard
 * rejects mismatched roles with a 403.
 *
 * - `@Protected()` — any authenticated principal (no role check).
 * - `@Protected(Role.USER)` — only users.
 * - `@Protected(Role.ADMIN, Role.USER)` — admins OR users.
 */
export function Protected(...roles: Role[]) {
  return SetMetadata(ROLES_KEY, roles);
}
