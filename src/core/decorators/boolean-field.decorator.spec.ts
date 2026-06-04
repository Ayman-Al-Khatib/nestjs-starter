import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { BooleanField } from './boolean-field.decorator';

class Dto {
  @BooleanField({ default: false })
  flag?: boolean;
}

describe('BooleanField', () => {
  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['false', false],
    [1, true],
    [0, false],
    ['1', true],
    ['0', false],
  ])('coerces %p to the boolean %p', (input, expected) => {
    const dto = plainToInstance(Dto, { flag: input });
    expect(dto.flag).toBe(expected);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('throws a BadRequestException for null or empty string', () => {
    expect(() => plainToInstance(Dto, { flag: null })).toThrow(BadRequestException);
    expect(() => plainToInstance(Dto, { flag: '' })).toThrow(BadRequestException);
  });

  it('throws for truthy-looking but unsupported strings', () => {
    expect(() => plainToInstance(Dto, { flag: 'yes' })).toThrow(BadRequestException);
  });
});
