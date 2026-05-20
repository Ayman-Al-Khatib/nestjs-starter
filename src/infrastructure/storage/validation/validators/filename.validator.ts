import { Injectable } from '@nestjs/common';
import { FileValidationError } from '../../core/errors/storage.error';
import { UploadInput } from '../../core/types/upload-input';
import { IFileValidator } from '../file-validator.interface';

const ALLOWED_NAME_PATTERN = /^[؀-ۿa-zA-Z0-9_.\-() ]+$/;

@Injectable()
export class FilenameValidator implements IFileValidator {
  validate(input: UploadInput): void {
    if (!input.originalName || input.originalName.includes('\0')) {
      throw new FileValidationError('File name is invalid', 'FILE_NAME_INVALID');
    }
    if (!ALLOWED_NAME_PATTERN.test(input.originalName)) {
      throw new FileValidationError(
        `File name "${input.originalName}" contains disallowed characters`,
        'FILE_NAME_DISALLOWED_CHARS',
      );
    }
  }
}
