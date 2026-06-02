import { generateOpaqueToken } from './token.util';

describe('generateOpaqueToken', () => {
  it('returns a 64-character base64url string by default (48 bytes)', () => {
    const token = generateOpaqueToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('never emits standard base64 padding or non-url-safe chars', () => {
    const token = generateOpaqueToken();
    expect(token).not.toMatch(/[+/=]/);
  });

  it('honors a custom byte length', () => {
    // base64url length for N bytes is ceil(N / 3) * 4 minus padding.
    expect(generateOpaqueToken(3)).toHaveLength(4);
    expect(generateOpaqueToken(6)).toHaveLength(8);
  });

  it('is effectively unique across invocations', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateOpaqueToken()));
    expect(tokens.size).toBe(100);
  });
});
