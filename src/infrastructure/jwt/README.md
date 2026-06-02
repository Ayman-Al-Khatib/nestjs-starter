# JWT

Signs and verifies **access tokens only**. Refresh tokens are opaque
random strings stored as SHA-256 hashes in
[`modules/refresh-tokens/`](../../modules/refresh-tokens/) — keep them
out of JWT-land on purpose.

## What lives here

- **`app-jwt.service.ts`** — `AppJwtService.createAccessToken(payload)` /
  `verifyAccessToken(token)`.
- **`interfaces/`** — `AccessTokenPayload` (input) and
  `DecodedAccessTokenPayload` (verified, with `iat`/`exp`).
- **`app-jwt.module.ts`** — registers `AppJwtService` globally.

`JwtAuthGuard` in [`core/guards/`](../../core/guards/jwt-auth.guard.ts)
consumes this service; everything else goes through `@Protected(...)`.

## Configuration

| Variable                          | Notes                                                          |
| --------------------------------- | -------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`               | ≥32 chars. HMAC secret                                         |
| `JWT_ACCESS_EXPIRES_IN_SECONDS`   | Access-token lifetime                                          |
| `JWT_REFRESH_EXPIRES_IN_SECONDS`  | Refresh-token lifetime (used by `RefreshTokenService`)         |
| `JWT_ISSUER`                      | Bound into `iss`. Mismatched tokens are rejected               |
| `JWT_AUDIENCE`                    | Bound into `aud`. Mismatched tokens are rejected               |

## Security choices

- **Algorithm pinned to `HS256`** on both sign *and* verify. Pinning on
  verify blocks `alg: none` and RS↔HS confusion attacks.
- **`iss` and `aud` claims** are set on sign and asserted on verify, so
  a token leaked from another deployment is rejected here.
- **Payload is minimal** — `{ userId, role }`. No PII, no flags. Anything
  else lives in the DB and is loaded on each request by
  `JwtAuthGuard` via the `UserResolverRegistry`.
- **Refresh tokens are opaque + DB-backed + rotated**. See
  [`modules/refresh-tokens/`](../../modules/refresh-tokens/) for the
  rotation + theft-detection contract.

## Revocation semantics (and the accepted trade-off)

Access tokens are **stateless and self-contained**: the guard verifies the
signature and loads the principal, but it does **not** consult a per-user
revocation timestamp. A token therefore stays valid until its `exp`, even
after the user changes credentials or logs out. The cost of closing that
window is a per-user `iat` check (extra column + per-request comparison);
this project accepts the window instead, because it is already bounded and
mitigated on three sides:

- **Short access lifetime** — `JWT_ACCESS_EXPIRES_IN_SECONDS=900` (15 min)
  in production caps the exposure of any leaked or stale access token.
- **Immediate refresh revocation** — credential rotation
  (`AdminService.updateMe`) and account disable call
  `RefreshTokenService.revokeAllForUser`, so no *new* access token can be
  minted past that point; the stolen one merely runs out the clock.
- **Auth-cache invalidation** — the same flows drop the cached principal
  (`CacheKeys.authUser`), so `isActive` flips and profile changes take
  effect on the very next request, not after the 5-min cache TTL.

If your deployment needs zero-window invalidation (e.g. a "log out
everywhere" that kills access tokens instantly), add a
`sessionsInvalidatedAt` column to the account entities and reject tokens
whose `iat` predates it inside `JwtAuthGuard`. Until that requirement is
real, the short-TTL posture above is the intended design.

> **Logout scope:** `POST /v1/auth/logout` revokes only the single
> presented refresh token (one session). Revoking *every* session is a
> separate operation (`revokeAllForUser`), used on credential rotation and
> reuse detection — not on ordinary logout.

## Usage

You almost never call this directly — `@Protected()` does it for you.
The only direct consumers are auth services that mint tokens:

```ts
constructor(private readonly jwt: AppJwtService) {}

const accessToken = this.jwt.createAccessToken({ userId: 42, role: Role.USER });
```

For protecting routes:

```ts
@Protected(Role.ADMIN)
@Controller({ path: 'admin/users', version: '1' })
export class AdminUserController { /* ... */ }
```

See [`core/`](../../core/README.md#auth--protected) for the guard +
resolver registry flow.
