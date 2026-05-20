import { StorageError } from '../core/errors/storage.error';

export function sanitizeKey(input: string): string {
  if (!input || typeof input !== 'string' || input.includes('\0')) {
    throw new StorageError('Invalid storage key');
  }

  const key = input.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');

  const segments = key.split('/');
  if (segments.some((s) => s === '..' || s === '.' || s === '')) {
    throw new StorageError('Invalid storage key');
  }

  return key;
}

export function joinKey(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((p) => p.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter(Boolean)
    .join('/');
}

export function stripPrefix(key: string, prefix: string): string {
  const normalized = sanitizeKey(key);
  const normalizedPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!normalizedPrefix) return normalized;
  if (normalized === normalizedPrefix) return '';
  if (normalized.startsWith(normalizedPrefix + '/')) {
    return normalized.substring(normalizedPrefix.length + 1);
  }
  return normalized;
}
