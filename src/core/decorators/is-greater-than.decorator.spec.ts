import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsGreaterThan } from './is-greater-than.decorator';

class RangeDto {
  start?: number;

  @IsGreaterThan('start')
  end?: number;
}

function errorsFor(plain: Partial<RangeDto>): number {
  return validateSync(plainToInstance(RangeDto, plain)).length;
}

describe('IsGreaterThan (via comparePropertyDecorator)', () => {
  it('passes when this value is strictly greater than the related one', () => {
    expect(errorsFor({ start: 1, end: 2 })).toBe(0);
  });

  it('works lexicographically on ISO time strings', () => {
    class TimeDto {
      start?: string;
      @IsGreaterThan('start')
      end?: string;
    }
    expect(validateSync(plainToInstance(TimeDto, { start: '09:00', end: '10:00' }))).toHaveLength(0);
    expect(
      validateSync(plainToInstance(TimeDto, { start: '10:00', end: '09:00' })).length,
    ).toBeGreaterThan(0);
  });

  it('fails when equal or smaller', () => {
    expect(errorsFor({ start: 5, end: 5 })).toBeGreaterThan(0);
    expect(errorsFor({ start: 5, end: 1 })).toBeGreaterThan(0);
  });

  it('short-circuits to valid when either side is null/undefined', () => {
    expect(errorsFor({ start: 1 })).toBe(0);
    expect(errorsFor({ end: 1 })).toBe(0);
  });
});
