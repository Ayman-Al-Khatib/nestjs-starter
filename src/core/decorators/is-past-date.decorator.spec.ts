import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsPastDate } from './is-past-date.decorator';

class Dto {
  @IsPastDate()
  d!: unknown;
}

function errorsFor(value: unknown): number {
  return validateSync(plainToInstance(Dto, { d: value })).length;
}

describe('IsPastDate', () => {
  it('accepts a Date strictly in the past', () => {
    expect(errorsFor(new Date('2000-01-01T00:00:00.000Z'))).toBe(0);
  });

  it('rejects a future Date', () => {
    expect(errorsFor(new Date(Date.now() + 86_400_000))).toBeGreaterThan(0);
  });

  it('rejects a non-Date value (no coercion of its own)', () => {
    expect(errorsFor('2000-01-01')).toBeGreaterThan(0);
    expect(errorsFor(new Date('invalid'))).toBeGreaterThan(0);
  });
});
