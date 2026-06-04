import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { EnvironmentConfig } from 'infrastructure/config';

const CORS_ALLOW_ANY = '*';
const CORS_ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const HSTS_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

export function configureSecurity(
  app: NestExpressApplication,
  config: ConfigService<EnvironmentConfig>,
): void {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // Pure JSON API + file storage — no HTML pages are intentionally served.
      // default-src 'none' blocks script execution in any SVG stored and served
      // directly (svg carries inline <script> tags that browsers execute).
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
        },
      },
      hsts: { maxAge: HSTS_MAX_AGE_SECONDS, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'no-referrer' },
      hidePoweredBy: true,
    }),
  );
  app.use(
    compression({
      threshold: 1024,
      level: 6,
      // Skip compression for token-bearing auth responses (login / refresh) to
      // defuse the theoretical BREACH oracle on secrets in a compressed body.
      // Everything else falls back to compression's default content-type filter.
      filter: (req, res) => {
        if (req.path.includes('/auth/')) return false;
        return compression.filter(req, res);
      },
    }),
  );

  const origins = config.getOrThrow<string[]>('CORS_ORIGINS');
  app.enableCors({
    origin: origins.includes(CORS_ALLOW_ANY) ? true : origins,
    methods: CORS_ALLOWED_METHODS,
    // Bearer-only auth — the API issues JWTs that clients carry in the
    // Authorization header, never in cookies. credentials:false keeps
    // browsers from sending cookies cross-origin and blocks the
    // wildcard-origin + credentials CSRF surface entirely.
    credentials: false,
    maxAge: 600,
  });
}
