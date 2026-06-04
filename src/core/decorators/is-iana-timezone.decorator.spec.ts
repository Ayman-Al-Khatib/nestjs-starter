import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsIanaTimezone } from './is-iana-timezone.decorator';

class Dto {
  @IsIanaTimezone()
  tz!: unknown;
}

function errorsFor(value: unknown): number {
  return validateSync(plainToInstance(Dto, { tz: value })).length;
}

describe('IsIanaTimezone', () => {
  it('accepts recognized IANA timezone names', () => {
    expect(errorsFor('Asia/Damascus')).toBe(0);
    expect(errorsFor('UTC')).toBe(0);
  });

  it('rejects unknown names and non-strings', () => {
    expect(errorsFor('Not/AZone')).toBeGreaterThan(0);
    expect(errorsFor(123)).toBeGreaterThan(0);
  });
});
