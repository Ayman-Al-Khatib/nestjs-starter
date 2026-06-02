import { CallHandler } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { createExecutionContext } from 'test-utils/test-helpers';
import { UtcDateSerializerInterceptor } from './utc-date-serializer.interceptor';

function callHandler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

describe('UtcDateSerializerInterceptor', () => {
  const interceptor = new UtcDateSerializerInterceptor();
  const ctx = createExecutionContext();

  async function run(value: unknown): Promise<unknown> {
    return firstValueFrom(interceptor.intercept(ctx, callHandler(value)));
  }

  it('serializes a top-level Date to an ISO-8601 Z string', async () => {
    const date = new Date('2026-06-02T10:00:00.000Z');
    await expect(run(date)).resolves.toBe('2026-06-02T10:00:00.000Z');
  });

  it('recursively serializes nested dates in objects and arrays', async () => {
    const result = await run({
      createdAt: new Date('2026-06-02T10:00:00.000Z'),
      items: [{ at: new Date('2026-01-01T00:00:00.000Z') }],
    });
    expect(result).toEqual({
      createdAt: '2026-06-02T10:00:00.000Z',
      items: [{ at: '2026-01-01T00:00:00.000Z' }],
    });
  });

  it('passes primitives and null/undefined through unchanged', async () => {
    await expect(run('text')).resolves.toBe('text');
    await expect(run(42)).resolves.toBe(42);
    await expect(run(null)).resolves.toBeNull();
  });

  it('leaves Buffers untouched (does not walk binary payloads)', async () => {
    const buf = Buffer.from('binary');
    await expect(run(buf)).resolves.toBe(buf);
  });
});
