import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { FileValidationError } from '../../core/errors/storage.error';
import { UploadInput } from '../../core/types/upload-input';
import { IFileValidator } from '../file-validator.interface';
import { ValidationPolicy } from '../validation-policy';

@Injectable()
export class DimensionsValidator implements IFileValidator {
  async validate(input: UploadInput, policy: ValidationPolicy): Promise<void> {
    const rule = policy.dimensions;
    if (!rule) return;
    if (!input.mimeType.startsWith('image/')) return;

    let width: number | undefined;
    let height: number | undefined;

    try {
      const meta = await sharp(input.buffer).metadata();
      width = meta.width;
      height = meta.height;
    } catch {
      throw new FileValidationError(
        `Could not read image metadata for ${input.originalName}`,
        'IMAGE_METADATA_UNREADABLE',
      );
    }

    if (!width || !height) {
      throw new FileValidationError(
        `Could not determine image dimensions for ${input.originalName}`,
        'IMAGE_DIMENSIONS_UNKNOWN',
      );
    }

    if (rule.minWidth && width < rule.minWidth) {
      throw new FileValidationError(
        `Image width ${width}px is below the minimum of ${rule.minWidth}px`,
        'IMAGE_TOO_NARROW',
      );
    }
    if (rule.maxWidth && width > rule.maxWidth) {
      throw new FileValidationError(
        `Image width ${width}px exceeds the maximum of ${rule.maxWidth}px`,
        'IMAGE_TOO_WIDE',
      );
    }
    if (rule.minHeight && height < rule.minHeight) {
      throw new FileValidationError(
        `Image height ${height}px is below the minimum of ${rule.minHeight}px`,
        'IMAGE_TOO_SHORT',
      );
    }
    if (rule.maxHeight && height > rule.maxHeight) {
      throw new FileValidationError(
        `Image height ${height}px exceeds the maximum of ${rule.maxHeight}px`,
        'IMAGE_TOO_TALL',
      );
    }
  }
}
