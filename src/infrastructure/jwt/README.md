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

## Usage

You almost never call this directly — `@Protected()` does it for you.
The only direct consumers are auth services that mint tokens:

```ts
constructor(private readonly jwt: AppJwtService) {}

const accessToken = this.jwt.createAccessToken({ userId: 42, role: Role.PATIENT });
```

For protecting routes:

```ts
@Protected(Role.DOCTOR)
@Controller({ path: 'doctor/appointments', version: '1' })
export class DoctorAppointmentController { /* ... */ }
```

See [`core/`](../../core/README.md#auth--protected) for the guard +
resolver registry flow.
