import { comparePassword, hashPassword, isPasswordHashed } from './password.util';

describe('password.util', () => {
  const originalRounds = process.env.BCRYPT_SALT_ROUNDS;

  afterEach(() => {
    if (originalRounds === undefined) {
      delete process.env.BCRYPT_SALT_ROUNDS;
    } else {
      process.env.BCRYPT_SALT_ROUNDS = originalRounds;
    }
  });

  describe('hashPassword', () => {
    it('produces a bcrypt hash that is not the plaintext', async () => {
      const hash = await hashPassword('s3cret-pass');
      expect(hash).not.toBe('s3cret-pass');
      expect(isPasswordHashed(hash)).toBe(true);
    });

    it('produces a distinct salt per call (no deterministic output)', async () => {
      const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
      expect(a).not.toBe(b);
    });

    it('falls back to the default cost when BCRYPT_SALT_ROUNDS is out of range', async () => {
      process.env.BCRYPT_SALT_ROUNDS = '999';
      const hash = await hashPassword('x');
      expect(hash).toMatch(/^\$2[aby]\$10\$/);
    });

    it('honors a valid BCRYPT_SALT_ROUNDS value', async () => {
      process.env.BCRYPT_SALT_ROUNDS = '4';
      const hash = await hashPassword('x');
      expect(hash).toMatch(/^\$2[aby]\$04\$/);
    });

    it('falls back to default when BCRYPT_SALT_ROUNDS is not a number', async () => {
      process.env.BCRYPT_SALT_ROUNDS = 'not-a-number';
      const hash = await hashPassword('x');
      expect(hash).toMatch(/^\$2[aby]\$10\$/);
    });
  });

  describe('comparePassword', () => {
    it('returns true for the matching plaintext', async () => {
      const hash = await hashPassword('correct-horse');
      await expect(comparePassword('correct-horse', hash)).resolves.toBe(true);
    });

    it('returns false for a wrong plaintext', async () => {
      const hash = await hashPassword('correct-horse');
      await expect(comparePassword('wrong', hash)).resolves.toBe(false);
    });
  });

  describe('isPasswordHashed', () => {
    it('recognizes bcrypt $2a/$2b/$2y prefixes', () => {
      expect(isPasswordHashed('$2a$10$' + 'x'.repeat(53))).toBe(true);
      expect(isPasswordHashed('$2b$12$' + 'x'.repeat(53))).toBe(true);
      expect(isPasswordHashed('$2y$08$' + 'x'.repeat(53))).toBe(true);
    });

    it('rejects plaintext and malformed values', () => {
      expect(isPasswordHashed('plaintext')).toBe(false);
      expect(isPasswordHashed('$2c$10$invalid')).toBe(false);
      expect(isPasswordHashed('')).toBe(false);
    });

    it('rejects non-string input defensively', () => {
      expect(isPasswordHashed(undefined as unknown as string)).toBe(false);
      expect(isPasswordHashed(null as unknown as string)).toBe(false);
    });
  });
});
