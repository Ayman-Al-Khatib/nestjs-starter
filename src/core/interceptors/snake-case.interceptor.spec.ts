import { CallHandler } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { createExecutionContext } from 'test-utils/test-helpers';
import { SnakeCaseInterceptor } from './snake-case.interceptor';

function callHandler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

describe('SnakeCaseInterceptor', () => {
  const interceptor = new SnakeCaseInterceptor();

  it('snake-cases the response when x-case-format: snake is requested', async () => {
    const ctx = createExecutionContext({ request: { headers: { 'x-case-format': 'Snake' } } });
    const result = await firstValueFrom(
      interceptor.intercept(ctx, callHandler({ firstName: 'a', nested: { createdAt: 1 } })),
    );
    expect(result).toEqual({ first_name: 'a', nested: { created_at: 1 } });
  });

  it('passes the response through unchanged without the header', async () => {
    const ctx = createExecutionContext({ request: { headers: {} } });
    const payload = { firstName: 'a' };
    const result = await firstValueFrom(interceptor.intercept(ctx, callHandler(payload)));
    expect(result).toBe(payload);
  });
});
