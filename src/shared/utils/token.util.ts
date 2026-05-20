import * as crypto from 'crypto';

const DEFAULT_TOKEN_BYTES = 48;

/**
 * Generates a cryptographically random opaque token suitable for refresh
 * tokens, password-reset links, API keys, etc. Default 48 bytes → 64-char
 * base64url string.
 */
export function generateOpaqueToken(byteLength: number = DEFAULT_TOKEN_BYTES): string {
  return crypto.randomBytes(byteLength).toString('base64url');
}
