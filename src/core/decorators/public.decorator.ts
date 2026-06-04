import { SetMetadata } from '@nestjs/common';

/** Reflector key the global JwtAuthGuard reads to skip authentication. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route (or whole controller) out of the global `JwtAuthGuard`.
 *
 * Authentication is fail-closed: every route requires a valid token unless it
 * is explicitly marked `@Public()`. Use this only for genuinely unauthenticated
 * surfaces — login / OTP / refresh, public lookups, health probes, and signed
 * file streaming (which authenticates via its own signature, not a JWT).
 */
export function Public(): MethodDecorator & ClassDecorator {
  return SetMetadata(IS_PUBLIC_KEY, true);
}
