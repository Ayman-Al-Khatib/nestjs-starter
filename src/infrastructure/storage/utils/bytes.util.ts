import { StorageError } from '../core/errors/storage.error';
import { FileSize } from '../core/types/file-size';

const UNIT_MULTIPLIERS: Record<string, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

const SIZE_PATTERN = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i;

/**
 * Parses a human-readable size literal (e.g. `10MB`, `150KB`) into bytes.
 * Self-contained — avoids depending on the untyped, transitively-pulled
 * `bytes` package whose contract could shift under us.
 */
export function parseSize(size: FileSize): number {
  const match = SIZE_PATTERN.exec(size.trim());
  if (!match) {
    throw new StorageError(`Invalid file size unit: ${size}`);
  }
  const amount = Number(match[1]);
  const multiplier = UNIT_MULTIPLIERS[match[2].toUpperCase()];
  if (Number.isNaN(amount) || multiplier === undefined) {
    throw new StorageError(`Invalid file size unit: ${size}`);
  }
  return Math.floor(amount * multiplier);
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = parseFloat((value / Math.pow(1024, i)).toFixed(2));
  return `${size} ${units[i]}`;
}
