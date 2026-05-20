import { Injectable } from '@nestjs/common';
import { FileValidationError } from '../../core/errors/storage.error';
import { UploadInput } from '../../core/types/upload-input';
import { formatBytes, parseSize } from '../../utils/bytes.util';
import { extractExtension } from '../../utils/file-name.util';
import { IFileValidator } from '../file-validator.interface';
import { ValidationPolicy } from '../validation-policy';

@Injectable()
export class SizeValidator implements IFileValidator {
  validate(input: UploadInput, policy: ValidationPolicy): void {
    if (input.size <= 0) {
      throw new FileValidationError('File is empty', 'FILE_EMPTY');
    }

    const globalMax = parseSize(policy.maxSize);
    if (input.size > globalMax) {
      throw new FileValidationError(
        `File size ${formatBytes(input.size)} exceeds maximum ${policy.maxSize}`,
        'FILE_TOO_LARGE',
        { actual: input.size, max: globalMax },
      );
    }

    if (policy.perTypeMaxSize) {
      const ext = extractExtension(input.originalName);
      const perTypeLimit = policy.perTypeMaxSize[ext];
      if (perTypeLimit) {
        const limit = parseSize(perTypeLimit);
        if (input.size > limit) {
          throw new FileValidationError(
            `File ${input.originalName} (${formatBytes(input.size)}) exceeds the ${perTypeLimit} limit for .${ext} files`,
            'FILE_TYPE_TOO_LARGE',
            { type: ext, actual: input.size, max: limit },
          );
        }
      }
    }
  }
}
