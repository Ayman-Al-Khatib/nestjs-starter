import bytes from 'bytes';
import { StorageError } from '../core/errors/storage.error';
import { FileSize } from '../core/types/file-size';

export function parseSize(size: FileSize): number {
  const value = bytes(size);
  if (value === null || Number.isNaN(value)) {
    throw new StorageError(`Invalid file size unit: ${size}`);
  }
  return value;
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = parseFloat((value / Math.pow(1024, i)).toFixed(2));
  return `${size} ${units[i]}`;
}
