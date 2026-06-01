import { LocalSigningService } from './local-signing.service';

describe('LocalSigningService', () => {
  const secret = 'unit-test-signing-secret-at-least-32-chars';
  let signing: LocalSigningService;

  beforeEach(() => {
    signing = new LocalSigningService(secret);
  });

  const futureExp = (): number => Math.floor(Date.now() / 1000) + 60;

  it('verifies a token it just signed', () => {
    const key = 'private/avatars/users/u1.png';
    const exp = futureExp();
    const token = signing.sign(key, exp);

    expect(signing.verify(key, exp, token)).toBe(true);
  });

  it('rejects a tampered token', () => {
    const key = 'private/file.png';
    const exp = futureExp();
    const token = signing.sign(key, exp);
    const tampered = (token[0] === 'a' ? 'b' : 'a') + token.slice(1);

    expect(signing.verify(key, exp, tampered)).toBe(false);
  });

  it('rejects an expired token even with a valid signature', () => {
    const key = 'private/file.png';
    const exp = Math.floor(Date.now() / 1000) - 1;
    const token = signing.sign(key, exp);

    expect(signing.verify(key, exp, token)).toBe(false);
  });

  it('rejects a signature minted for a different key', () => {
    const exp = futureExp();
    const token = signing.sign('private/a.png', exp);

    expect(signing.verify('private/b.png', exp, token)).toBe(false);
  });
});
