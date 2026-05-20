import { Inject, Injectable } from '@nestjs/common';
import { ResolvedStorageConfig } from '../config/storage-config';
import {
  STORAGE_CONFIG,
  STORAGE_IMAGE_PROCESSOR,
  STORAGE_PROVIDER,
} from '../config/storage-tokens';
import { Visibility } from '../core/enums/visibility.enum';
import { StorageError } from '../core/errors/storage.error';
import { AccessOptions, AccessUrl } from '../core/types/access-url';
import { StoredFile } from '../core/types/stored-file';
import { UploadInput } from '../core/types/upload-input';
import { SaveTarget, UploadOptions } from '../core/types/upload-options';
import { CompressionPolicy } from '../processing/compression-policy';
import { IImageProcessor } from '../processing/image-processor.interface';
import { IStorageProvider } from '../providers/storage-provider.interface';
import { uniqueFileName } from '../utils/file-name.util';
import { joinKey } from '../utils/path.util';
import { FileValidationService } from '../validation/file-validation.service';
import { ValidationPolicy } from '../validation/validation-policy';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider,
    @Inject(STORAGE_IMAGE_PROCESSOR) private readonly imageProcessor: IImageProcessor,
    @Inject(STORAGE_CONFIG) private readonly config: ResolvedStorageConfig,
    private readonly validation: FileValidationService,
  ) {}

  async upload(input: UploadInput, options: UploadOptions): Promise<StoredFile> {
    const validationPolicy = this.resolveValidation(options.validation);
    if (validationPolicy) {
      await this.validation.validate(input, validationPolicy);
    }

    const compressionPolicy = this.resolveCompression(options.compression);
    const finalInput = compressionPolicy
      ? await this.imageProcessor.process(input, compressionPolicy)
      : input;

    const target = this.buildSaveTarget(finalInput, options);
    return this.provider.save(finalInput, target);
  }

  async uploadMany(inputs: UploadInput[], options: UploadOptions): Promise<StoredFile[]> {
    const validationPolicy = this.resolveValidation(options.validation);
    if (validationPolicy) {
      await this.validation.validateMany(inputs, validationPolicy);
    }

    const compressionPolicy = this.resolveCompression(options.compression);
    const processed = compressionPolicy
      ? await Promise.all(inputs.map((i) => this.imageProcessor.process(i, compressionPolicy)))
      : inputs;

    const items = processed.map((input) => ({
      input,
      target: this.buildSaveTarget(input, options),
    }));

    if (this.provider.saveMany) {
      return this.provider.saveMany(items);
    }
    return Promise.all(items.map(({ input, target }) => this.provider.save(input, target)));
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (this.provider.deleteMany) {
      return this.provider.deleteMany(keys);
    }
    await Promise.all(keys.map((k) => this.provider.delete(k).catch(() => undefined)));
  }

  exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  read(key: string): Promise<Buffer> {
    return this.provider.read(key);
  }

  async getAccessUrl(key: string, options: AccessOptions = {}): Promise<AccessUrl> {
    const visibility = visibilityOf(key);
    if (visibility === Visibility.PUBLIC) {
      return { url: this.provider.publicUrl(key) };
    }
    const ttl = options.ttlSeconds ?? this.config.signedUrlTtlSeconds;
    return this.provider.signedUrl(key, ttl);
  }

  async getAccessUrls(keys: string[], options: AccessOptions = {}): Promise<AccessUrl[]> {
    if (!keys.length) return [];

    const ttl = options.ttlSeconds ?? this.config.signedUrlTtlSeconds;
    const result: AccessUrl[] = new Array(keys.length);
    const privateEntries: { key: string; index: number }[] = [];

    for (let i = 0; i < keys.length; i++) {
      if (visibilityOf(keys[i]) === Visibility.PUBLIC) {
        result[i] = { url: this.provider.publicUrl(keys[i]) };
      } else {
        privateEntries.push({ key: keys[i], index: i });
      }
    }

    if (privateEntries.length > 0) {
      const privateKeys = privateEntries.map((e) => e.key);
      const signed = this.provider.signedUrls
        ? await this.provider.signedUrls(privateKeys, ttl)
        : await Promise.all(privateKeys.map((k) => this.provider.signedUrl(k, ttl)));

      for (let i = 0; i < privateEntries.length; i++) {
        result[privateEntries[i].index] = signed[i];
      }
    }

    return result;
  }

  private buildSaveTarget(input: UploadInput, options: UploadOptions): SaveTarget {
    const filename = uniqueFileName(input.originalName);
    const key = joinKey(options.visibility, options.folder ?? '', filename);
    return {
      key,
      visibility: options.visibility,
      contentType: input.mimeType,
    };
  }

  private resolveValidation(
    override: Partial<ValidationPolicy> | false | undefined,
  ): ValidationPolicy | null {
    if (override === false) return null;
    return { ...this.config.defaultValidation, ...(override ?? {}) };
  }

  private resolveCompression(
    override: Partial<CompressionPolicy> | false | undefined,
  ): CompressionPolicy | null {
    if (override === false) return null;
    const merged = { ...this.config.defaultCompression, ...(override ?? {}) };
    return merged.enabled ? merged : null;
  }
}

function visibilityOf(key: string): Visibility {
  const prefix = key.replace(/^\/+/, '').split('/')[0];
  if (prefix === Visibility.PUBLIC) return Visibility.PUBLIC;
  if (prefix === Visibility.PRIVATE) return Visibility.PRIVATE;
  throw new StorageError(`Cannot determine visibility from key: ${key}`);
}
