import { sanitizeKey } from '../utils/path.util';

export abstract class BaseStorageProvider {
  protected normalizeKey(key: string): string {
    return sanitizeKey(key);
  }
}
