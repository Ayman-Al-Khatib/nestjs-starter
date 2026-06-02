import { validateEnvironment } from './env.validator';

describe('validateEnvironment', () => {
  it('throws a formatted aggregate error when required vars are missing', () => {
    expect(() => validateEnvironment({})).toThrow(/Environment validation failed/);
  });

  it('lists the offending paths in the error message', () => {
    try {
      validateEnvironment({ JWT_ACCESS_SECRET: 'too-short' });
      fail('expected validateEnvironment to throw');
    } catch (err) {
      expect((err as Error).message).toContain('JWT_ACCESS_SECRET');
    }
  });
});
