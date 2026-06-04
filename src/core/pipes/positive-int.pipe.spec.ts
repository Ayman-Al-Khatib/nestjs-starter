import { BadRequestException } from '@nestjs/common';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { PositiveIntPipe } from './positive-int.pipe';

describe('PositiveIntPipe', () => {
  const translator = createTranslatorMock();
  const pipe = new PositiveIntPipe(translator);

  it('parses a positive integer string', () => {
    expect(pipe.transform('42')).toBe(42);
  });

  it('parses a numeric string with trailing characters via parseInt semantics', () => {
    expect(pipe.transform('15abc')).toBe(15);
  });

  it('rejects a non-numeric value', () => {
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
  });

  it('rejects zero and negatives', () => {
    expect(() => pipe.transform('0')).toThrow(BadRequestException);
    expect(() => pipe.transform('-5')).toThrow(BadRequestException);
  });
});
