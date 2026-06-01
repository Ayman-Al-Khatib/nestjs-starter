import { z } from 'zod';

export const jwtSchema = z.object({
  // HS256 signing key. Minimum 32 chars so the secret has at least the
  // entropy of the HMAC-SHA256 output it keys; shorter secrets weaken the MAC.
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().int().positive(),

  JWT_REFRESH_EXPIRES_IN_SECONDS: z.coerce.number().int().positive(),

  // Bound to the access token's `iss` / `aud` claims. Verification rejects any
  // token whose claims do not match — prevents tokens minted for a sibling
  // service (or a stolen secret reused elsewhere) from authenticating here.
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),
});

export type JwtConfig = z.infer<typeof jwtSchema>;
