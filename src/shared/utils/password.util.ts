import * as bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 10;
const MIN_SALT_ROUNDS = 4;
const MAX_SALT_ROUNDS = 31;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

/**
 * Salt rounds are read lazily from `BCRYPT_SALT_ROUNDS` so this util stays
 * usable inside TypeORM entity lifecycle hooks where DI is not available.
 * Falls back to a safe default when the env var is missing or out of range.
 */
function resolveSaltRounds(): number {
  const raw = process.env.BCRYPT_SALT_ROUNDS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isInteger(parsed) && parsed >= MIN_SALT_ROUNDS && parsed <= MAX_SALT_ROUNDS
    ? parsed
    : DEFAULT_SALT_ROUNDS;
}

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, resolveSaltRounds());
}

export function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function isPasswordHashed(value: string): boolean {
  return typeof value === 'string' && BCRYPT_HASH_PATTERN.test(value);
}
