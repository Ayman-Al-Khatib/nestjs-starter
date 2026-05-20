import 'express';

import { BaseAccountEntity } from 'domain/entities/base-account.entity';

/**
 * Augments Express's `Request` with values populated by the application's
 * middleware/guard stack:
 *
 *  - `user`       — authenticated principal attached by `JwtAuthGuard`.
 *                   Concrete role is available via `request.user.role`
 *                   (each entity implements the abstract getter on
 *                   `BaseAccountEntity`), so there is intentionally no
 *                   separate `role` field — the entity is the single
 *                   source of truth. Unauthenticated routes leave `user`
 *                   undefined.
 *
 *  - `requestId`  — correlation ID set by `RequestIdMiddleware`. Honours
 *                   an inbound `x-request-id` header when present so
 *                   distributed tracing survives gateway hops; otherwise
 *                   a fresh UUID v4 is generated. Echoed back on the
 *                   response and included in error logs.
 */
declare global {
  namespace Express {
    interface Request {
      user?: BaseAccountEntity;
      requestId?: string;
    }
  }
}
