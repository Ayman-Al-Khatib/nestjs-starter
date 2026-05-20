/**
 * Centralized cache-key namespaces. New consumers add a `CacheKeys.<feature>`
 * helper here so prefixes stay searchable and `deletePattern` calls don't
 * grow free-form strings.
 */
export const CacheKeys = {
  /** `auth:user:<role>:<userId>` — auth principal cached by JwtAuthGuard. */
  authUser: (role: string, userId: number | string): string =>
    `auth:user:${role}:${userId}`,

  /** Pattern that matches every cached principal for a given role+user. */
  authUserPattern: (role: string, userId: number | string): string =>
    `auth:user:${role}:${userId}`,
} as const;

/**
 * Default TTLs in seconds. Keep these aligned with the lifetime of the
 * source of truth (e.g. auth user TTL ≤ access-token TTL) so a stale
 * cache entry can never outlive its underlying authorization.
 */
export const CacheTtl = {
  // Slightly shorter than the access token expiry (typically 900s) — a
  // revoked/blocked user is picked up on the next refresh cycle at worst.
  AUTH_USER_SECONDS: 300,
} as const;
