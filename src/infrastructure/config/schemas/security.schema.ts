import { z } from 'zod';
import { Environment } from '../env.constant';

const CORS_ALLOW_ANY = '*';

const CSV_LIST = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const securitySchema = z.object({
  // Comma-separated allowlist of origins. Use `*` to allow any origin (development only).
  // Examples: `https://app.example.com,https://admin.example.com`
  // Cross-validated by refineSecurityConfig: forbidden when NODE_ENV=production
  // since `*` combined with credentials echoes the request Origin and lets any
  // site send authenticated requests.
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform(CSV_LIST)
    .pipe(z.array(z.string().min(1)).min(1)),

  // Express `trust proxy` setting. Accepts boolean keywords, an integer (hops),
  // or a CIDR/IP list. See: https://expressjs.com/en/guide/behind-proxies.html
  TRUST_PROXY: z.string().default('loopback'),

  // Max body size accepted by the JSON / urlencoded parsers (e.g. `1mb`, `512kb`).
  // File uploads go through Multer, which has its own per-route limits.
  BODY_LIMIT: z.string().default('1mb'),
});

export const refineSecurityConfig = (
  value: { NODE_ENV: Environment; CORS_ORIGINS?: string[] },
  ctx: z.RefinementCtx,
): void => {
  if (
    value.NODE_ENV === Environment.PRODUCTION &&
    value.CORS_ORIGINS?.includes(CORS_ALLOW_ANY)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['CORS_ORIGINS'],
      message:
        'CORS_ORIGINS must not contain "*" when NODE_ENV=production — wildcard with credentials echoes the request Origin and exposes authenticated endpoints to any site.',
    });
  }
};

export type SecurityConfig = z.infer<typeof securitySchema>;
