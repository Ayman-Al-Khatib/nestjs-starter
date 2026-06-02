import { StorageError } from '../core/errors/storage.error';
import { FileSize } from '../core/types/file-size';
import { formatBytes, parseSize } from './bytes.util';

describe('parseSize', () => {
  it.each<[FileSize, number]>([
    ['1B', 1],
    ['1KB', 1024],
    ['10MB', 10 * 1024 ** 2],
    ['2GB', 2 * 1024 ** 3],
    ['1TB', 1024 ** 4],
  ])('parses %s to %d bytes', (literal, expected) => {
    expect(parseSize(literal)).toBe(expected);
  });

  it('is case-insensitive and tolerates surrounding whitespace', () => {
    expect(parseSize(' 10mb ' as FileSize)).toBe(10 * 1024 ** 2);
  });

  it('supports fractional amounts and floors the result', () => {
    expect(parseSize('1.5KB' as FileSize)).toBe(1536);
  });

  it('throws StorageError on an unknown unit or malformed literal', () => {
    expect(() => parseSize('10PB' as FileSize)).toThrow(StorageError);
    expect(() => parseSize('abc' as FileSize)).toThrow(StorageError);
    expect(() => parseSize('' as FileSize)).toThrow(StorageError);
  });
});

describe('formatBytes', () => {
  it.each<[number, string]>([
    [0, '0 B'],
    [-5, '0 B'],
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [10 * 1024 ** 2, '10 MB'],
  ])('formats %d bytes as %s', (value, expected) => {
    expect(formatBytes(value)).toBe(expected);
  });

  it('returns "0 B" for non-finite input', () => {
    expect(formatBytes(NaN)).toBe('0 B');
    expect(formatBytes(Infinity)).toBe('0 B');
  });

  it('clamps to the largest known unit (TB) for very large values', () => {
    expect(formatBytes(1024 ** 6)).toMatch(/TB$/);
  });
});
