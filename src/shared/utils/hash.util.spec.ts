import { sha256 } from './hash.util';

describe('sha256', () => {
  it('produces the known SHA-256 hex digest for a fixed input', () => {
    expect(sha256('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('returns a 64-character lowercase hex string', () => {
    expect(sha256('any-value')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', () => {
    expect(sha256('repeat')).toBe(sha256('repeat'));
  });

  it('produces different digests for different inputs', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });

  it('hashes the empty string to the canonical empty digest', () => {
    expect(sha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
