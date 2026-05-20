import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Visibility } from '../../core/enums/visibility.enum';
import { FileNotFoundError, StorageProviderError } from '../../core/errors/storage.error';
import { AccessUrl } from '../../core/types/access-url';
import { StoredFile } from '../../core/types/stored-file';
import { UploadInput } from '../../core/types/upload-input';
import { SaveTarget } from '../../core/types/upload-options';
import { stripPrefix } from '../../utils/path.util';
import { BaseStorageProvider } from '../base.provider';
import { IStorageProvider } from '../storage-provider.interface';
import {
  SUPABASE_CLIENT,
  SUPABASE_PRIVATE_BUCKET,
  SUPABASE_PUBLIC_BUCKET,
} from './supabase.tokens';

@Injectable()
export class SupabaseStorageProvider extends BaseStorageProvider implements IStorageProvider {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    @Inject(SUPABASE_PUBLIC_BUCKET) private readonly publicBucket: string,
    @Inject(SUPABASE_PRIVATE_BUCKET) private readonly privateBucket: string,
  ) {
    super();
  }

  async save(input: UploadInput, target: SaveTarget): Promise<StoredFile> {
    const bucket = this.bucketFor(target.visibility);
    const path = this.pathFor(target.key);

    const { error } = await this.client.storage.from(bucket).upload(path, input.buffer, {
      upsert: true,
      contentType: target.contentType ?? input.mimeType,
    });

    if (error)
      throw new StorageProviderError(`Failed to upload to Supabase: ${error.message}`, error);

    return {
      key: target.key,
      visibility: target.visibility,
      size: input.size,
      mimeType: input.mimeType,
    };
  }

  async saveMany(items: { input: UploadInput; target: SaveTarget }[]): Promise<StoredFile[]> {
    return Promise.all(items.map(({ input, target }) => this.save(input, target)));
  }

  async delete(key: string): Promise<void> {
    const visibility = this.visibilityFromKey(key);
    const { error } = await this.client.storage
      .from(this.bucketFor(visibility))
      .remove([this.pathFor(key)]);
    if (error)
      throw new StorageProviderError(`Failed to delete from Supabase: ${error.message}`, error);
  }

  async deleteMany(keys: string[]): Promise<void> {
    const grouped = new Map<string, string[]>();
    for (const key of keys) {
      const bucket = this.bucketFor(this.visibilityFromKey(key));
      const arr = grouped.get(bucket) ?? [];
      arr.push(this.pathFor(key));
      grouped.set(bucket, arr);
    }

    await Promise.all(
      [...grouped.entries()].map(async ([bucket, paths]) => {
        const { error } = await this.client.storage.from(bucket).remove(paths);
        if (error) {
          throw new StorageProviderError(`Failed to delete from Supabase: ${error.message}`, error);
        }
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    const { data } = await this.client.storage
      .from(this.bucketFor(this.visibilityFromKey(key)))
      .exists(this.pathFor(key));
    return Boolean(data);
  }

  async read(key: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucketFor(this.visibilityFromKey(key)))
      .download(this.pathFor(key));
    if (error) throw new FileNotFoundError(key);
    return Buffer.from(await data.arrayBuffer());
  }

  publicUrl(key: string): string {
    const visibility = this.visibilityFromKey(key);
    if (visibility !== Visibility.PUBLIC) {
      throw new StorageProviderError('publicUrl called for a non-public key');
    }
    const { data } = this.client.storage.from(this.publicBucket).getPublicUrl(this.pathFor(key));
    return data.publicUrl;
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<AccessUrl> {
    const visibility = this.visibilityFromKey(key);
    const { data, error } = await this.client.storage
      .from(this.bucketFor(visibility))
      .createSignedUrl(this.pathFor(key), ttlSeconds);
    if (error || !data) {
      throw new StorageProviderError(`Failed to sign URL: ${error?.message ?? 'unknown'}`, error);
    }
    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  async signedUrls(keys: string[], ttlSeconds: number): Promise<AccessUrl[]> {
    // Group paths by bucket so each bucket gets one createSignedUrls call.
    const byBucket = new Map<string, { path: string; index: number }[]>();
    for (let i = 0; i < keys.length; i++) {
      const bucket = this.bucketFor(this.visibilityFromKey(keys[i]));
      const group = byBucket.get(bucket) ?? [];
      group.push({ path: this.pathFor(keys[i]), index: i });
      byBucket.set(bucket, group);
    }

    const result: AccessUrl[] = new Array(keys.length);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await Promise.all(
      [...byBucket.entries()].map(async ([bucket, entries]) => {
        const paths = entries.map((e) => e.path);
        const { data, error } = await this.client.storage
          .from(bucket)
          .createSignedUrls(paths, ttlSeconds);
        if (error || !data) {
          throw new StorageProviderError(
            `Failed to sign URLs: ${error?.message ?? 'unknown'}`,
            error,
          );
        }
        for (let i = 0; i < entries.length; i++) {
          const entry = data[i];
          if (entry.error || !entry.signedUrl) {
            throw new StorageProviderError(
              `Failed to sign URL for ${paths[i]}: ${entry.error ?? 'no URL returned'}`,
            );
          }
          result[entries[i].index] = { url: entry.signedUrl, expiresAt };
        }
      }),
    );

    return result;
  }

  private bucketFor(visibility: Visibility): string {
    return visibility === Visibility.PRIVATE ? this.privateBucket : this.publicBucket;
  }

  private visibilityFromKey(key: string): Visibility {
    const prefix = this.normalizeKey(key).split('/')[0];
    if (prefix === Visibility.PRIVATE) return Visibility.PRIVATE;
    return Visibility.PUBLIC;
  }

  private pathFor(key: string): string {
    const visibility = this.visibilityFromKey(key);
    return stripPrefix(key, visibility);
  }
}
