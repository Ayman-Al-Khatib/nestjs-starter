import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsGreaterThanOrEqual } from './is-greater-than-or-equal.decorator';

class RangeDto {
  minPrice?: number;

  @IsGreaterThanOrEqual('minPrice')
  maxPrice?: number;
}

function errorsFor(plain: Partial<RangeDto>): number {
  return validateSync(plainToInstance(RangeDto, plain)).length;
}

describe('IsGreaterThanOrEqual', () => {
  it('accepts greater-than and equal values', () => {
    expect(errorsFor({ minPrice: 10, maxPrice: 20 })).toBe(0);
    expect(errorsFor({ minPrice: 10, maxPrice: 10 })).toBe(0);
  });

  it('rejects a smaller value', () => {
    expect(errorsFor({ minPrice: 10, maxPrice: 5 })).toBeGreaterThan(0);
  });

  it('short-circuits when either side is absent', () => {
    expect(errorsFor({ maxPrice: 5 })).toBe(0);
    expect(errorsFor({ minPrice: 5 })).toBe(0);
  });
});
