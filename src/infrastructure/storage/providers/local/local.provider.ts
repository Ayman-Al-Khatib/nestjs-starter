import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Visibility } from '../../core/enums/visibility.enum';
import { FileNotFoundError, StorageProviderError } from '../../core/errors/storage.error';
import { AccessUrl } from '../../core/types/access-url';
import { StoredFile } from '../../core/types/stored-file';
import { UploadInput } from '../../core/types/upload-input';
import { SaveTarget } from '../../core/types/upload-options';
import { BaseStorageProvider } from '../base.provider';
import { IStorageProvider } from '../storage-provider.interface';
import { LOCAL_STORAGE_ROUTE } from './local.constants';
import { LocalSigningService } from './local-signing.service';
import { LOCAL_STORAGE_BASE_PATH, LOCAL_STORAGE_PUBLIC_BASE_URL } from './local.tokens';

@Injectable()
export class LocalStorageProvider extends BaseStorageProvider implements IStorageProvider {
  constructor(
    @Inject(LOCAL_STORAGE_BASE_PATH) private readonly basePath: string,
    @Inject(LOCAL_STORAGE_PUBLIC_BASE_URL) private readonly publicBaseUrl: string,
    private readonly signing: LocalSigningService,
  ) {
    super();
  }

  async save(input: UploadInput, target: SaveTarget): Promise<StoredFile> {
    const key = this.normalizeKey(target.key);
    const fullPath = path.join(this.basePath, key);

    try {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, input.buffer);
    } catch (e: unknown) {
      throw new StorageProviderError(`Failed to save file: ${e instanceof Error ? e.message : String(e)}`, e);
    }

    return {
      key,
      visibility: target.visibility,
      size: input.size,
      mimeType: input.mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, this.normalizeKey(key));
    try {
      await fs.unlink(fullPath);
    } catch (e: unknown) {
      if (e instanceof Error && (e as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw new StorageProviderError(`Failed to delete file: ${e instanceof Error ? e.message : String(e)}`, e);
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, this.normalizeKey(key));
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async read(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, this.normalizeKey(key));
    try {
      return await fs.readFile(fullPath);
    } catch (e: unknown) {
      if (e instanceof Error && (e as NodeJS.ErrnoException).code === 'ENOENT') throw new FileNotFoundError(key);
      throw new StorageProviderError(`Failed to read file: ${e instanceof Error ? e.message : String(e)}`, e);
    }
  }

  resolveAbsolutePath(key: string): string {
    return path.join(this.basePath, this.normalizeKey(key));
  }

  publicUrl(key: string): string {
    if (key.split('/')[0] !== Visibility.PUBLIC) {
      throw new StorageProviderError('publicUrl called for a non-public key');
    }
    return joinUrl(this.publicBaseUrl, LOCAL_STORAGE_ROUTE, this.normalizeKey(key));
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<AccessUrl> {
    const normalized = this.normalizeKey(key);
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const token = this.signing.sign(normalized, expiresAt);
    const url = `${joinUrl(this.publicBaseUrl, LOCAL_STORAGE_ROUTE, normalized)}?token=${token}&exp=${expiresAt}`;
    return { url, expiresAt: new Date(expiresAt * 1000) };
  }

  signedUrls(keys: string[], ttlSeconds: number): Promise<AccessUrl[]> {
    return Promise.all(keys.map((k) => this.signedUrl(k, ttlSeconds)));
  }
}

function joinUrl(base: string, ...segments: string[]): string {
  const cleanedBase = base.replace(/\/+$/, '');
  const cleanedSegments = segments
    .map((s) => s.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter(Boolean);
  if (cleanedBase) {
    return [cleanedBase, ...cleanedSegments].join('/');
  }
  return '/' + cleanedSegments.join('/');
}
