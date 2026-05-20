import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Recursively converts every `Date` instance in the response body into
 * an ISO-8601 UTC string (always ending with `Z`). Runs as the outermost
 * response transform so consumers never see a raw Date.
 */
@Injectable()
export class UtcDateSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(serializeDates));
  }
}

function serializeDates(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeDates);
  if (typeof value !== 'object') return value;
  if (Buffer.isBuffer(value) || ArrayBuffer.isView(value)) return value;

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as object)) {
    result[key] = serializeDates((value as Record<string, unknown>)[key]);
  }
  return result;
}
