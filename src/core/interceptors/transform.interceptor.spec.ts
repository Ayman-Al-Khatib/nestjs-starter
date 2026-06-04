import { CallHandler } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { createExecutionContext } from 'test-utils/test-helpers';
import { TransformInterceptor } from './transform.interceptor';

function callHandler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();
  const ctx = createExecutionContext();

  it('wraps a plain payload in a { data } envelope', async () => {
    const result = await firstValueFrom(interceptor.intercept(ctx, callHandler({ id: 1 })));
    expect(result).toEqual({ data: { id: 1 } });
  });

  it('preserves an existing pagination block from a paginated result', async () => {
    const paginated = { data: [1, 2], pagination: { total: 2 } };
    const result = await firstValueFrom(interceptor.intercept(ctx, callHandler(paginated)));
    expect(result).toEqual({ data: [1, 2], pagination: { total: 2 } });
  });

  it('emits { data: null } for a null response and omits the pagination key', async () => {
    const result = await firstValueFrom(interceptor.intercept(ctx, callHandler(null)));
    expect(result).toEqual({ data: null });
    expect('pagination' in result).toBe(false);
  });

  it('treats a primitive value as the data payload', async () => {
    const result = await firstValueFrom(interceptor.intercept(ctx, callHandler('ok')));
    expect(result).toEqual({ data: 'ok' });
  });
});
