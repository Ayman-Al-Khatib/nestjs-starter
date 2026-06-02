import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsTimeHHMM } from './is-time-hhmm.decorator';

class Dto {
  @IsTimeHHMM()
  time!: unknown;
}

function errorsFor(value: unknown): number {
  return validateSync(plainToInstance(Dto, { time: value })).length;
}

describe('IsTimeHHMM', () => {
  it('accepts valid 24-hour HH:mm times', () => {
    expect(errorsFor('00:00')).toBe(0);
    expect(errorsFor('08:30')).toBe(0);
    expect(errorsFor('23:59')).toBe(0);
  });

  it('rejects out-of-range or unpadded times', () => {
    expect(errorsFor('24:00')).toBeGreaterThan(0);
    expect(errorsFor('12:60')).toBeGreaterThan(0);
    expect(errorsFor('8:30')).toBeGreaterThan(0);
  });

  it('rejects non-string input', () => {
    expect(errorsFor(830)).toBeGreaterThan(0);
  });
});
