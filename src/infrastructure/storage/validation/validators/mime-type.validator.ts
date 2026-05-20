import { Injectable } from '@nestjs/common';
import magicBytes from 'magic-bytes.js';
import { FileValidationError } from '../../core/errors/storage.error';
import { UploadInput } from '../../core/types/upload-input';
import { extractExtension } from '../../utils/file-name.util';
import { IFileValidator } from '../file-validator.interface';
import { ValidationPolicy } from '../validation-policy';

@Injectable()
export class MimeTypeValidator implements IFileValidator {
  validate(input: UploadInput, policy: ValidationPolicy): void {
    const ext = extractExtension(input.originalName);
    if (!ext) {
      throw new FileValidationError(
        `File ${input.originalName} has no extension`,
        'FILE_EXTENSION_MISSING',
      );
    }

    const allowed = policy.allowedExtensions.map((e) => e.toLowerCase());
    if (!allowed.includes(ext)) {
      throw new FileValidationError(
        `File type .${ext} is not allowed. Allowed types: ${allowed.join(', ')}`,
        'FILE_TYPE_NOT_ALLOWED',
        { extension: ext, allowed },
      );
    }

    if (!policy.enforceMagicBytes) return;

    if (input.mimeType.startsWith('text/') || ext === 'txt') return;

    const detected = magicBytes(input.buffer);
    if (!detected.length) {
      throw new FileValidationError(
        `Cannot determine real file type of ${input.originalName}`,
        'FILE_SIGNATURE_UNKNOWN',
      );
    }

    const detectedSubtypes = detected
      .map((d) => d.mime?.split('/')[1])
      .filter(Boolean) as string[];
    const claimedSubtype = input.mimeType.split('/')[1];

    if (!detectedSubtypes.includes(claimedSubtype)) {
      throw new FileValidationError(
        `File ${input.originalName} content does not match its declared type`,
        'FILE_SIGNATURE_MISMATCH',
        { claimed: input.mimeType, detected: detectedSubtypes },
      );
    }
  }
}
