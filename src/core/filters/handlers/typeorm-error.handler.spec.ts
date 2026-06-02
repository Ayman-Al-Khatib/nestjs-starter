import { HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeOrmErrorHandler } from './typeorm-error.handler';

function queryFailed(driverError: { code?: string; errno?: number }): QueryFailedError {
  const err = new QueryFailedError('SELECT 1', [], driverError as unknown as Error);
  (err as unknown as { driverError: unknown }).driverError = driverError;
  return err;
}

describe('TypeOrmErrorHandler', () => {
  const handler = new TypeOrmErrorHandler();

  it('handles only QueryFailedError', () => {
    expect(handler.canHandle(queryFailed({ code: '23505' }))).toBe(true);
    expect(handler.canHandle(new Error())).toBe(false);
  });

  it('maps a Postgres unique-violation (23505) to 409 DUPLICATE_RECORD', () => {
    const res = handler.handle(queryFailed({ code: '23505' }));
    expect(res.statusCode).toBe(HttpStatus.CONFLICT);
    expect(res.error).toBe('DUPLICATE_RECORD');
  });

  it('maps a Postgres FK violation (23503) to 400 INVALID_REFERENCE', () => {
    const res = handler.handle(queryFailed({ code: '23503' }));
    expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(res.error).toBe('INVALID_REFERENCE');
  });

  it('maps a MySQL duplicate (errno 1062) to 409 DUPLICATE_RECORD', () => {
    const res = handler.handle(queryFailed({ errno: 1062 }));
    expect(res.statusCode).toBe(HttpStatus.CONFLICT);
    expect(res.error).toBe('DUPLICATE_RECORD');
  });

  it('falls back to a generic 500 DATABASE_ERROR for unknown codes', () => {
    const res = handler.handle(queryFailed({ code: '99999' }));
    expect(res.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.error).toBe('DATABASE_ERROR');
  });

  it('masks the specific error code for mapped 5xx responses', () => {
    const res = handler.handle(queryFailed({ code: '42P01' }));
    expect(res.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.error).toBe('DATABASE_ERROR');
  });
});
