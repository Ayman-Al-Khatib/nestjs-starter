import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';
// RFC 4122 v4 UUID — accepted as a trusted inbound ID. Anything else
// (free-form strings from misconfigured clients, attempts to inject
// markup into logs) is replaced with a fresh server-generated UUID.
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Assigns a correlation ID to every request and echoes it back on the
 * response. Honours an inbound `x-request-id` when it looks like a UUID v4
 * so distributed tracing carries across gateway hops; replaces anything
 * else with a fresh UUID to keep logs uninjectable.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const inbound = req.headers[REQUEST_ID_HEADER];
    const candidate = Array.isArray(inbound) ? inbound[0] : inbound;
    const requestId =
      typeof candidate === 'string' && UUID_V4_PATTERN.test(candidate)
        ? candidate
        : randomUUID();

    req.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
