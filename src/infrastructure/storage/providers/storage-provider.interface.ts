import { AccessUrl } from '../core/types/access-url';
import { StoredFile } from '../core/types/stored-file';
import { UploadInput } from '../core/types/upload-input';
import { SaveTarget } from '../core/types/upload-options';

export interface IStorageProvider {
  save(input: UploadInput, target: SaveTarget): Promise<StoredFile>;
  saveMany?(items: { input: UploadInput; target: SaveTarget }[]): Promise<StoredFile[]>;

  delete(key: string): Promise<void>;
  deleteMany?(keys: string[]): Promise<void>;

  exists(key: string): Promise<boolean>;
  read(key: string): Promise<Buffer>;

  publicUrl(key: string): string;
  signedUrl(key: string, ttlSeconds: number): Promise<AccessUrl>;
  signedUrls?(keys: string[], ttlSeconds: number): Promise<AccessUrl[]>;
}
