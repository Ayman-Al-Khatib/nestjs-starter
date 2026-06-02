import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsName } from './is-name.decorator';

class Dto {
  @IsName()
  name!: unknown;
}

function errorsFor(value: unknown): number {
  return validateSync(plainToInstance(Dto, { name: value })).length;
}

describe('IsName', () => {
  it('accepts a pure English name', () => {
    expect(errorsFor('Ahmad')).toBe(0);
    expect(errorsFor('Ahmad Ali')).toBe(0);
  });

  it('accepts a pure Arabic name', () => {
    expect(errorsFor('محمد')).toBe(0);
    expect(errorsFor('محمد علي')).toBe(0);
  });

  it('rejects a mixed Arabic/English name', () => {
    expect(errorsFor('Ahmad محمد')).toBeGreaterThan(0);
  });

  it('rejects leading/trailing or doubled spaces', () => {
    expect(errorsFor(' Ahmad')).toBeGreaterThan(0);
    expect(errorsFor('Ahmad ')).toBeGreaterThan(0);
    expect(errorsFor('Ahmad  Ali')).toBeGreaterThan(0);
  });

  it('rejects digits, symbols, and non-string input', () => {
    expect(errorsFor('Ahmad1')).toBeGreaterThan(0);
    expect(errorsFor('Ahmad-Ali')).toBeGreaterThan(0);
    expect(errorsFor(42)).toBeGreaterThan(0);
  });
});
