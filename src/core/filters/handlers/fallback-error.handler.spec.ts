import { HttpStatus } from '@nestjs/common';
import { FallbackErrorHandler } from './fallback-error.handler';

describe('FallbackErrorHandler', () => {
  const handler = new FallbackErrorHandler();

  it('always claims it can handle anything', () => {
    expect(handler.canHandle()).toBe(true);
  });

  it('returns a generic 500 with the error message tucked into details', () => {
    const res = handler.handle(new Error('boom'));
    expect(res.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.error).toBe('INTERNAL_SERVER_ERROR');
    expect(res.message).toBe('An unexpected error occurred');
    expect(res.context?.details).toBe('boom');
  });

  it('stringifies non-Error throwables', () => {
    const res = handler.handle('a raw string');
    expect(res.context?.details).toBe('a raw string');
  });
});
