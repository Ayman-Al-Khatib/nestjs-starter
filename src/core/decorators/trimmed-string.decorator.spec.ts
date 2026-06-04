import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { TrimmedString } from './trimmed-string.decorator';

class DefaultDto {
  @TrimmedString({ max: 5 })
  value!: unknown;
}

class OptionalEmptyDto {
  @TrimmedString({ allowEmpty: true })
  value!: unknown;
}

class NoTrimDto {
  @TrimmedString({ trim: false })
  value!: unknown;
}

describe('TrimmedString', () => {
  it('trims surrounding whitespace before validating', () => {
    const dto = plainToInstance(DefaultDto, { value: '  abc  ' });
    expect(dto.value).toBe('abc');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects a value that is empty after trimming', () => {
    expect(validateSync(plainToInstance(DefaultDto, { value: '   ' })).length).toBeGreaterThan(0);
  });

  it('enforces the max length on the trimmed value', () => {
    expect(validateSync(plainToInstance(DefaultDto, { value: 'toolong' })).length).toBeGreaterThan(
      0,
    );
  });

  it('rejects non-string input', () => {
    expect(validateSync(plainToInstance(DefaultDto, { value: 123 })).length).toBeGreaterThan(0);
  });

  it('allows empty strings when allowEmpty is set', () => {
    expect(validateSync(plainToInstance(OptionalEmptyDto, { value: '' }))).toHaveLength(0);
  });

  it('preserves whitespace when trim is disabled', () => {
    const dto = plainToInstance(NoTrimDto, { value: ' keep ' });
    expect(dto.value).toBe(' keep ');
  });
});
