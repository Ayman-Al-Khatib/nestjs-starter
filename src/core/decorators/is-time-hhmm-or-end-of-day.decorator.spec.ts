import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsTimeHHMMOrEndOfDay } from './is-time-hhmm-or-end-of-day.decorator';

class Dto {
  @IsTimeHHMMOrEndOfDay()
  end!: unknown;
}

function errorsFor(value: unknown): number {
  return validateSync(plainToInstance(Dto, { end: value })).length;
}

describe('IsTimeHHMMOrEndOfDay', () => {
  it('accepts normal HH:mm times', () => {
    expect(errorsFor('09:30')).toBe(0);
    expect(errorsFor('23:59')).toBe(0);
  });

  it('accepts the 24:00 end-of-day sentinel', () => {
    expect(errorsFor('24:00')).toBe(0);
  });

  it('rejects out-of-range times beyond the sentinel', () => {
    expect(errorsFor('24:01')).toBeGreaterThan(0);
    expect(errorsFor('25:00')).toBeGreaterThan(0);
  });
});
