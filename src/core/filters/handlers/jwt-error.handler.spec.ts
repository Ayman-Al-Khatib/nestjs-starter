import { HttpStatus } from '@nestjs/common';
import { JwtErrorHandler } from './jwt-error.handler';

function named(name: string): Error {
  const err = new Error(name);
  err.name = name;
  return err;
}

describe('JwtErrorHandler', () => {
  const handler = new JwtErrorHandler();

  it('detects jsonwebtoken errors by name (not instanceof)', () => {
    expect(handler.canHandle(named('JsonWebTokenError'))).toBe(true);
    expect(handler.canHandle(named('TokenExpiredError'))).toBe(true);
    expect(handler.canHandle(named('NotBeforeError'))).toBe(true);
    expect(handler.canHandle(named('SomeOtherError'))).toBe(false);
    expect(handler.canHandle('not an error')).toBe(false);
  });

  it('maps an expired token to 401 TOKEN_EXPIRED', () => {
    const res = handler.handle(named('TokenExpiredError'));
    expect(res.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(res.error).toBe('TOKEN_EXPIRED');
  });

  it('maps any other jwt error to 401 TOKEN_INVALID', () => {
    const res = handler.handle(named('JsonWebTokenError'));
    expect(res.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(res.error).toBe('TOKEN_INVALID');
  });
});
