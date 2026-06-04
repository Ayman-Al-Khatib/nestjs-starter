import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { StorageProviderError } from '../core/errors/storage.error';
import { UploadInput } from '../core/types/upload-input';
import { parseSize } from '../utils/bytes.util';
import { extractBaseName, extractExtension } from '../utils/file-name.util';
import { CompressionPolicy, ImageFormat } from './compression-policy';
import { IImageProcessor } from './image-processor.interface';

const SUPPORTED: ReadonlySet<string> = new Set([
  'jpeg',
  'jpg',
  'png',
  'webp',
  'gif',
  'tiff',
  'tif',
  'avif',
  'heif',
]);

@Injectable()
export class SharpImageProcessor implements IImageProcessor {
  async process(input: UploadInput, policy: CompressionPolicy): Promise<UploadInput> {
    if (!policy.enabled) return input;

    const ext = extractExtension(input.originalName);
    if (!SUPPORTED.has(ext)) return input;

    try {
      const { buffer, format } = await this.compress(input.buffer, policy);
      const newName = `${extractBaseName(input.originalName)}.${format}`;
      return {
        buffer,
        originalName: newName,
        mimeType: `image/${format}`,
        size: buffer.length,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new StorageProviderError(`Image compression failed: ${message}`, e);
    }
  }

  private async compress(
    buffer: Buffer,
    policy: CompressionPolicy,
  ): Promise<{ buffer: Buffer; format: ImageFormat }> {
    const targetBytes = parseSize(policy.maxOutputSize);
    const dimensions = await this.optimalDimensions(buffer, targetBytes);

    let quality = policy.quality;
    let currentBuffer = await sharp(buffer)
      .resize({ ...dimensions, fit: 'inside', withoutEnlargement: true })
      .toFormat(policy.outputFormat, { quality })
      .toBuffer();

    while (currentBuffer.length > targetBytes && quality > policy.minQuality) {
      quality -= 5;
      currentBuffer = await sharp(buffer)
        .resize({ ...dimensions, fit: 'inside', withoutEnlargement: true })
        .toFormat(policy.outputFormat, { quality })
        .toBuffer();
    }

    return { buffer: currentBuffer, format: policy.outputFormat };
  }

  private async optimalDimensions(buffer: Buffer, targetBytes: number) {
    const meta = await sharp(buffer).metadata();
    const ratio = Math.sqrt(targetBytes / buffer.length);
    return {
      width: Math.max(1, Math.round((meta.width ?? 0) * ratio) || 1),
      height: Math.max(1, Math.round((meta.height ?? 0) * ratio) || 1),
    };
  }
}
