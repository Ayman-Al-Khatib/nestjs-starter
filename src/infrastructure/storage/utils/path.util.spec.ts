import { StorageError } from '../core/errors/storage.error';
import { joinKey, sanitizeKey, stripPrefix } from './path.util';

describe('sanitizeKey', () => {
  it('normalizes backslashes and trims leading/trailing slashes', () => {
    expect(sanitizeKey('\\avatars\\1.png\\')).toBe('avatars/1.png');
    expect(sanitizeKey('/avatars/1.png/')).toBe('avatars/1.png');
  });

  it('rejects path traversal and dot segments', () => {
    expect(() => sanitizeKey('../secret')).toThrow(StorageError);
    expect(() => sanitizeKey('a/../b')).toThrow(StorageError);
    expect(() => sanitizeKey('a/./b')).toThrow(StorageError);
    expect(() => sanitizeKey('a//b')).toThrow(StorageError);
  });

  it('rejects empty, non-string, or null-byte keys', () => {
    expect(() => sanitizeKey('')).toThrow(StorageError);
    expect(() => sanitizeKey('a\0b')).toThrow(StorageError);
    expect(() => sanitizeKey(undefined as unknown as string)).toThrow(StorageError);
  });
});

describe('joinKey', () => {
  it('joins parts with single slashes, dropping empties and stray slashes', () => {
    expect(joinKey('avatars', '1', 'photo.png')).toBe('avatars/1/photo.png');
    expect(joinKey('/avatars/', '', '/1/')).toBe('avatars/1');
  });

  it('returns an empty string when all parts are empty', () => {
    expect(joinKey('', '')).toBe('');
  });
});

describe('stripPrefix', () => {
  it('removes a matching prefix segment', () => {
    expect(stripPrefix('public/avatars/1.png', 'public')).toBe('avatars/1.png');
  });

  it('returns the sanitized key unchanged when the prefix does not match', () => {
    expect(stripPrefix('private/1.png', 'public')).toBe('private/1.png');
  });

  it('returns empty string when the key equals the prefix', () => {
    expect(stripPrefix('public', 'public')).toBe('');
  });

  it('returns the sanitized key when the prefix is empty', () => {
    expect(stripPrefix('/avatars/1.png', '')).toBe('avatars/1.png');
  });
});
