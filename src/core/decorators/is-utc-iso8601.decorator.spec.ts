import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsUtcIso8601 } from './is-utc-iso8601.decorator';

class Dto {
  @IsUtcIso8601()
  at!: unknown;
}

describe('IsUtcIso8601', () => {
  it('converts a valid UTC ISO-8601 string into a Date and passes', () => {
    const dto = plainToInstance(Dto, { at: '2026-06-02T10:00:00.000Z' });
    expect(dto.at).toBeInstanceOf(Date);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('accepts the second-precision form without milliseconds', () => {
    const dto = plainToInstance(Dto, { at: '2026-06-02T10:00:00Z' });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects a date without time/Z (left as a string)', () => {
    const dto = plainToInstance(Dto, { at: '2026-06-02' });
    expect(dto.at).toBe('2026-06-02');
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects an offset other than Z and non-string input', () => {
    expect(validateSync(plainToInstance(Dto, { at: '2026-06-02T10:00:00+03:00' })).length).toBeGreaterThan(0);
    expect(validateSync(plainToInstance(Dto, { at: 12345 })).length).toBeGreaterThan(0);
  });
});
